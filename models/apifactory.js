/**
 *
 * Factory for producing REST and mongoose models for general resources.
 *
 */
"use strict";

var express = require('express');
var mongoose = require('mongoose');
var userAuth = require('../middleware/user');
var user_ioAuth = require('../middleware/user_io');

var error = require('../error');
var _ = require('lodash');
var url = require('url');

var Settings = mongoose.model('settings');

var bodyParser = require('body-parser');

// Returns true on the first occurence of a commone element between two
// sorted arrays. False if there are no common elements
var hasCommonElement = function(sortedArray1, sortedArray2) {
  var i, j;

  i = 0;
  j = 0;

  while (i < sortedArray1.length && j < sortedArray2.length) {
    if (sortedArray1[i] === sortedArray2[j]) {
      return true;
    } else if (sortedArray1[i] < sortedArray2[j]) {
      i++;
    } else {
      j++;
    }
  }

  return false;
};

var api = {};
var jsonApi = {};
var server = null;

var addModels = function(models) {
  // creates a pure json formatted string represenation of this model
  var formatModel = function(api) {

  };

  for (var model in models) {

    if (api[model]) {
      throw new Error("Model " + model + " has already been defined");
    }

    var apiModel = models[model];
    api[model] = apiModel;

    var ModelError = error('routes.api.' + model);

    //
    // Build the database model using mongoose
    //

    // boilerplate schema for all resource models
    var schema = {
      // time created in unix time [milliseconds]
      created: {
        type: Number,
        default: 0
      },
      // time last edited in unix time [milliseconds]
      edited: {
        type: Number,
        default: 0
      },
      // unavailable until this resource can be reviewed for content
      flagged: {
        type: Boolean,
        default: false
      },
      // no longer can be accessed from public api
      removed: {
        type: Boolean,
        default: false
      },
      // store access permissions here
      security: {
        type: mongoose.Schema.Types.Mixed
      }
    };

    // if a user is not the owner they can still interact with the resource
    // these are a list of qualifying, required, and forbidden attributes
    // a user must satisfy to perform the given class of operation
    //
    var secure = {};

    if (apiModel.view && apiModel.view.secure) {
      secure.view = true;
    }

    // add method specific security
    for (var prop in apiModel.view) {
      if (apiModel.view[prop].secure) {
        if (secure.view) {
          throw new Error('Security cannot be applied at two different levels.');
        }

        secure['view.' + prop] = true;
      }
    }

    if (apiModel.action && apiModel.action.secure) {
      secure.action = true;
    }

    for (var prop in apiModel.action) {
      if (apiModel.action[prop].secure) {
        if (secure.action) {
          throw new Error('Security cannot be applied at two different levels.');
        }

        secure['action.' + prop] = true;
      }
    }

    // add custom shema to the model
    for (var param in apiModel.state.independent) {
      schema[param] = apiModel.state.independent[param];
    }

    for (var param in apiModel.state.dependent) {
      schema[param] = apiModel.state.dependent[param];
    }

    var Schema = new mongoose.Schema(schema);

    if (apiModel.state.index) {
      Schema.index(apiModel.state.index);
    }

    // add custom methods to the model
    // these are not exposed in the api, but can be used on database results
    for (var param in apiModel.internal) {
      Schema.methods[param] = apiModel.internal[param];
    }

    Schema.methods.editEvent = function() {
      // TODO: send update to socket io since it is already in memory.
      this.edited = Date.now();
      return this;
    };

    Schema.methods.testAccess = function(action, user) {

      if (this.deleted) {
        throw new ModelError('removed',
          'This [0] has been peranently removed.', [model],
          410);
      }

      if (this.flagged) {
        // TODO: add an admin bypass to this
        throw new ModelError('flagged',
          'This [0] has been flagged for review and is temporarily unavailable.', [model],
          503);
      }

      var security = this.security[action];


      if (action !== 'root' && (!secure[action] || (security && security.unrestricted))) {
        // if there is no security, let anyone through (root is always secure)
        return true;
      }

      // there is security, so a user has to be logged in at least
      if (!user) {
        return false;
      }

      var user_id = '' + user._id;

      if (security) {

        // try finding the user directly
        if (security.users && _.indexOf(security.users, user_id, true) !== -1) {

          return true;
        }

        // see if the user belongs to a group that has access
        if (user.groups && security.groups && hasCommonElement(user.groups, security.groups)) {
          return true;
        }
      }

      if (action === 'root') {
        // if root is not authorized then out of luck
        return false;
      } else {
        // as a last resort, any user able to be root can do also anything else
        return this.testAccess('root', user);
      }

    };

    Schema.methods.grantUserAccess = function(actions, user) {
      var element = this;
      var user_id = '' + user._id;

      if (!element.security) {
        element.security = {};
      }

      actions.forEach(function(action) {
        var security = element.security[action] || (element.security[action] = {});

        if (!security.users) {
          security.users = [];
        }

        var index = _.sortedIndex(security.users, user_id);

        if (security.users[index] !== user_id) {
          security.users.splice(index, 0, user_id);
        }

      });

      element.markModified('security');

      return user.accessGranted(model, actions, element).return(element.editEvent().save());
    };

    Schema.methods.revokeUserAccess = function(actions, user) {
      var element = this;
      var user_id = '' + user._id;

      actions.forEach(function(action) {
        var security = element.security[action];

        var index = _.indexOf(security.users, user_id, true);

        if (index !== -1) {
          security.users.splice(index, 1);
        }
      });

      element.markModified('security');

      return user.accessRevoked(model, actions, element).return(element.editEvent().save());
    };

    Schema.methods.grantGroupAccess = function(actions, group) {
      var element = this;
      var group_id = '' + group._id;

      if (!element.security) {
        element.security = {};
      }

      actions.forEach(function(action) {
        var security = element.security[action] || (element.security[action] = {});

        if (!security.groups) {
          security.groups = [];
        }

        var index = _.sortedIndex(security.groups, group_id);

        if (security.groups[index] !== group_id) {
          security.groups.splice(index, 0, group_id);
        }

      });

      element.markModified('security');

      return group.accessGranted(model, actions, element).return(element.editEvent().save());
    };

    Schema.methods.revokeGroupAccess = function(actions, group) {
      var element = this;
      var group_id = '' + group._id;

      actions.forEach(function(action) {
        var security = element.security[action];

        var index = _.indexOf(security.groups, group_id, true);

        if (index !== -1) {
          security.groups.splice(index, 1);
        }
      });

      element.markModified('security');

      return group.accessRevoked(model, actions, element).return(element.editEvent().save());

    };

    var Model = mongoose.model(model, Schema);

    // if this is the user model, these two will be the same
    var User = mongoose.model('user');

    var apiHandle = {
      settings: {}
    };

    // load settings
    Settings.find({
      model: model
    })
    .exec()
    .then(function(settings) {

      if (apiModel.settings) {
        // if there is a custom settings handler, use result of the function
        apiHandle.settings = apiModel.settings(settings) || {};
      } else {
        apiHandle.settings = settings || {};
      }

    }).catch(function(error) {
      // TODO: ?
    });

    var apiMiddleware = function(req, res, next) {
      req.api = apiHandle;
      next();
    };

    //
    // Make a pure json format string of Model
    //
    var jsonModel = {
      state: {
        independent: {},
        dependent: {}
      },
      static: {},
      view: {},
      action: {},
      secure: secure
    };

    jsonApi[model] = jsonModel;

    for (var prop in apiModel.static) {
      jsonModel.static[prop] = {};
    }

    for (var prop in apiModel.view) {
      jsonModel.view[prop] = {};
    }

    for (var prop in apiModel.action) {
      jsonModel.action[prop] = {};
    }

    //
    // Create the necessary routes to use the modeled resource using express.
    //

    var router = express.Router();

    //
    // static methods
    //

    // get information about the model api
    router.get('/model', function(req, res, next) {
      try {
        res.json(jsonModel);
      } catch (error) {
        next(error);
      }
    });

    for (var prop in apiModel.static) {

      (function(prop, method) {
        router.get('/' + prop + (method.parameter ? '/' + method.parameter : ''),
          bodyParser.urlencoded({
            extended: false
          }),
          apiMiddleware,
          function(req, res, next) {
            try {
              method.handler.apply(null, [req, res])
                .then(function(result) {
                  res.json(result || []);
                })
                .catch(function(error) {
                  next(error);
                });
            } catch (error) {
              next(error);
            }
          });
      })(prop, apiModel.static[prop]);

    }

    // add a new resource
    router.post('/',
      bodyParser.json(),
      bodyParser.urlencoded({
        extended: false
      }),
      userAuth(),
      apiMiddleware,
      function(req, res, next) {
        try {

          if (!req.user) {
            throw new ModelError('nouser',
              'A user must be logged in to add a [0].', [model],
              401);
          }

          var new_element = new Model();

          new_element.created = Date.now();

          for (var param in apiModel.state.independent) {
            if (req.body[param]) {
              new_element[param] = req.body[param];
            }
          }

          new_element.grantUserAccess((apiModel.create && apiModel.create.creatorAccess) || ['root'], req.user)
          .then(function(element) {
            if (apiModel.create && apiModel.create.handler) {
              var result = apiModel.create.handler.apply(element, [req, res]);

              if (result) {
                // assume it returned a promise
                return result.return(element.editEvent().save());
              }
            }

            return element.editEvent().save();

          })
          .then(function(element) {
            res.json(element);
          })
          .catch(function(error) {
            next(error);
          });
        } catch (error) {
          next(error);
        }
      });


    //
    // Add exposed api view methods
    //

    for (var prop in apiModel.view) {
      if (prop === 'secure') {
        // this is just the security flag, not an actual route
        continue;
      }

      (function(prop, method) {
        // construct the uri route to this view
        var route;
        if (prop === 'root') {
          route = '/:id';
        }else{
          route = '/:id/' + prop + (method.parameter ? '/' + method.parameter : '');
        }

        if (secure['view']) {
          // all views are secure, so authenticate all requests
          router.get(route,
            bodyParser.urlencoded({
              extended: false
            }),
            userAuth(),
            apiMiddleware,
            function(req, res, next) {
              try {
                var query = Model.findById('' + req.params.id);

                if (method.populate) {
                  // populate any fields needed for this view
                  method.populate.forEach(function(population) {
                    query = query.populate(population);
                  });
                }

                query.exec()
                .then(function(element) {

                  // authorize user at the view level for all views
                  if (!element.testAccess('view', req.user)) {
                    throw new ModelError('noaccess',
                      'User does not have permission to [0] this [1].', ['view', model],
                      403);
                  }

                  if (method.handler) {
                    // use the custom handler if there is one
                    return method.handler.apply(element, [req, res]);
                  }

                  return element;
                })
                .then(function(result) {

                  return result;

                })
                .catch(function(error) {
                  next(error);
                });
              } catch (error) {
                next(error);
              }
            });
        } else if (secure['view.' + prop]) {
          // this particular view is secure so authenticate all requests
          router.get(route,
            bodyParser.urlencoded({
              extended: false
            }),
            userAuth(),
            apiMiddleware,
            function(req, res, next) {
              try {
                var query = Model.findById('' + req.params.id);

                if (method.populate) {
                  // populate any fields needed for this view
                  method.populate.forEach(function(population) {
                    query = query.populate(population);
                  });
                }

                query.exec()
                .then(function(element) {

                  if (!element.testAccess('view.' + prop, req.user)) {
                    // authorize user to this particular view
                    throw new ModelError('noaccess',
                      'User does not have permission to [0] this [1].', ['view.' + prop, model],
                      403);
                  }

                  if (method.handler) {
                    // use the custom handler if there is one
                    return method.handler.apply(element, [req, res]);
                  }

                  return element;
                })
                .then(function(result) {
                  res.json(result);
                })
                .catch(function(error) {
                  next(error);
                });
              } catch (error) {
                next(error);
              }
            });
        } else {
          // there is no security for this view so no need to authenticate requests
          router.get(route,
            bodyParser.urlencoded({
              extended: false
            }),
            apiMiddleware,
            function(req, res, next) {
              try {
                var query = Model.findById('' + req.params.id);

                if (method.populate) {
                  // populate any fields needed for this view
                  method.populate.forEach(function(population) {
                    query = query.populate(population);
                  });
                }

                query.exec()
                .then(function(element) {
                  if (!element.testAccess('view')) {
                    // even though there is no user, may be restricted to everyone for some reason
                    throw new ModelError('noaccess',
                      'User does not have permission to [0] this [1].', ['view', model],
                      403);
                  }

                  if (method.handler) {
                    // use the custom handler if there is one
                    return method.handler.apply(element, [req, res]);
                  }

                  return element;
                })
                .then(function(result) {
                  res.json(result);
                })
                .catch(function(error) {
                  next(error);
                });
              } catch (error) {
                next(error);
              }
            });
        }
      })(prop, apiModel.view[prop]);
    }

    //
    // action methods
    //

    for (var prop in apiModel.action) {
      if (prop === 'secure') {
        continue;
      }

      // perform a 'post' api call to the resource
      (function(prop, method) {
        // construct the uri route to this action
        var route;
        if (prop === 'root') {
          route = '/:id';
        }else{
          route = '/:id/' + prop + (method.parameter ? '/' + method.parameter : '');
        }

        if (secure['action']) {
          // all action requests must be authenticated
          router.post(route,
            bodyParser.json(),
            bodyParser.urlencoded({
              extended: false
            }),
            userAuth(),
            apiMiddleware,
            function(req, res, next) {
              try {
                var query = Model.findById('' + req.params.id);

                if (method.populate) {
                  method.populate.forEach(function(population) {
                    query = query.populate(population);
                  });
                }

                query.exec()
                .then(function(element) {
                  if (!element.testAccess('action', req.user)) {
                    throw new ModelError('noaccess',
                      'User does not have permission to [0] this [1].', ['action', model],
                      403);
                  }

                  if (prop === 'root') {
                    for (var param in apiModel.state.independent) {
                      // update any independent fields that were supplied directly
                      // in the request
                      if (req.body[param]) {
                        element[param] = req.body[param];
                      }
                    }
                  }

                  if (method.handler) {
                    var result = method.handler.apply(element, [req, res]);

                    if (result) {
                      // assumes a promise is returned, if anything
                      return result.return(element.editEvent().save());
                    }
                  }

                  return element.editEvent().save();
                })
                .then(function(result) {
                  res.json(result);
                })
                .catch(function(error) {
                  next(error);
                });
              } catch (error) {
                next(error);
              }
            });
        } else if (secure['action.' + prop]) {
          router.post(route,
            bodyParser.json(),
            bodyParser.urlencoded({
              extended: false
            }),
            userAuth(),
            apiMiddleware,
            function(req, res, next) {

              try {
                var query = Model.findById('' + req.params.id);

                if (method.populate) {
                  method.populate.forEach(function(population) {
                    query = query.populate(population);
                  });
                }

                query.exec()
                .then(function(element) {

                  if (!element.testAccess('action.' + prop, req.user)) {
                    throw new ModelError('noaccess',
                      'User does not have permission to [0] this [1].', ['action.' + prop, model],
                      403);
                  }

                  if (prop === 'root') {

                    for (var param in apiModel.state.independent) {
                      // update any independent fields that were supplied directly
                      // in the request
                      if (req.body[param]) {
                        element[param] = req.body[param];
                      }
                    }
                  }

                  if (method.handler) {
                    var result = method.handler.apply(element, [req, res]);

                    if (result) {
                      // assumes a promise is returned, if anything
                      return result.return(element.editEvent().save());
                    }
                  }

                  return element.editEvent().save();
                })
                .then(function(result) {
                  res.json(result);
                })
                .catch(function(error) {
                  next(error);
                });
              } catch (error) {
                next(error);
              }
            });
        } else {
          router.post(route,
            bodyParser.json(),
            bodyParser.urlencoded({
              extended: false
            }),
            apiMiddleware,
            function(req, res, next) {
              try {
                var query = Model.findById('' + req.params.id);

                if (method.populate) {
                  method.populate.forEach(function(population) {
                    query = query.populate(population);
                  });
                }

                query.exec()
                .then(function(element) {

                  if (!element.testAccess('action')) {
                    throw new ModelError('noaccess',
                      'User does not have permission to [0] this [1].', ['action', model],
                      403);
                  }

                  if (prop === 'root') {
                    for (var param in apiModel.state.independent) {
                      // update any independent fields that were supplied directly
                      // in the request
                      if (req.body[param]) {
                        element[param] = req.body[param];
                      }
                    }
                  }

                  if (method.handler) {
                    var result = method.handler.apply(element, [req, res]);

                    if (result) {
                      // assumes a promise is returned, if anything
                      return result.return(element.editEvent().save());
                    }
                  }

                  return element.editEvent().save();
                })
                .then(function(result) {
                  res.json(result);
                })
                .catch(function(error) {
                  next(error);
                });
              } catch (error) {
                next(error);
              }
            });
        }
      })(prop, apiModel.action[prop]);
    }


    server.express.use('/api/' + model, router);



  }
};

//
// Create the necessary route/event handlers for websocket connections
// to this resource.
//



module.exports = function(serverInstance) {
  server = serverInstance;

  server.express.get('/api', function(req, res, next) {
    try {
      res.json(jsonApi);
    } catch (error) {
      next(error);
    }
  });

  server.io.on('connect', function(socket) {
    try {
      user_ioAuth(socket);

      socket.on('disconnect', function(){
        // remove listeners
      });

      // listen for changes to a particular resource.
      socket.on('subscribe', function(data) {
        mongoose.model('' + data.model).findById('' + data._id)
        .exec()
        .then(function(element) {
          // first make sure they have permission to even see this stuff
          var view = 'view.' + data.view;

          if (!element.testAccess(view, socket.user)) {
            throw new ModelError('noaccess',
              'User does not have permission to [0] this [1].', [view, data.model],
              403);
          }

          // create subscription
        })
        .catch(function(error) {
          socket.emit('error', error);
        });
      });

      socket.on('unsubscribe', function(data) {

      });

      socket.on('report', function(data) {

      });

    } catch (error) {
      socket.emit('error', error);
    }

  });

  return {
    addModels: addModels
  };
};
