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

    // can change something about the resource
    if (apiModel.update && apiModel.update.secure) {
      secure.update = true;
    }

    // can access information about this resource, but cannot alter it in any way
    if (apiModel.get && apiModel.get.secure) {
      secure.get = true;
    }

    if (apiModel.safe && apiModel.safe.secure) {
      secure.safe = true;
    }

    // add method specific security
    for (var prop in apiModel.safe) {
      if (apiModel.safe[prop].secure) {
        if (secure.safe) {
          throw new Error('Security cannot be applied at two different levels.');
        }

        secure['safe.' + prop] = true;
      }
    }

    if (apiModel.unsafe && apiModel.unsafe.secure) {
      secure.unsafe = true;
    }

    for (var prop in apiModel.unsafe) {
      if (apiModel.unsafe[prop].secure) {
        if (secure.unsafe) {
          throw new Error('Security cannot be applied at two different levels.');
        }

        secure['unsafe.' + prop] = true;
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

    Schema.methods.event = function(name, data) {
      server.io.to(model + "_" + this._id).emit(name, data);
    };

    Schema.methods.testAccess = function(action, user) {

      var security = this.security[action];
      var user_id = '' + user._id;

      if (action !== 'root' && (!secure[action] || (security && security.unrestricted))) {
        // if there is no security, let anyone through (root is always secure)
        return true;
      }



      // there is security, so a user has to be logged in at least
      if (!user) {
        return false;
      }

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

      return user.accessGranted(model, actions, element).return(element.save());
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

      return user.accessRevoked(model, actions, element).return(element.save());
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

      return group.accessGranted(model, actions, element).return(element.save());
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

      return group.accessRevoked(model, actions, element).return(element.save());

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
      }).exec()
      .then(function(settings) {

        if (apiModel.settings) {
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
      safe: {},
      unsafe: {},
      secure: secure
    };

    jsonApi[model] = jsonModel;

    for (var prop in apiModel.static) {
      jsonModel.static[prop] = {};
    }

    for (var prop in apiModel.safe) {
      jsonModel.safe[prop] = {};
    }

    for (var prop in apiModel.unsafe) {
      jsonModel.unsafe[prop] = {};
    }

    //
    // Create the necessary routes to use the modeled resource using express.
    //

    var router = express.Router();


    // full or partial update of the permissions
    router.post('/:id/permissions',
      bodyParser.json(),
      bodyParser.urlencoded({
        extended: false
      }),
      userAuth(),
      apiMiddleware,
      function(req, res, next) {
        try {

          Model.findById('' + req.params.id)
            .exec()
            .then(function(element) {
              // this will blow up the request if there is not proper permission
              if (!element.testAccess('root', req.user)) {
                throw new ModelError('noaccess',
                  'User does not have permission to alter the permissions of this [1].', ['root', model],
                  403);
              }

              // TODO: have to set the permissions properly

              return element.save();
            })
            .then(function(element) {
              var response = {};

              response[model] = element;

              res.json(response)
            })
            .catch(function(error) {
              next(error);
            });
        } catch (error) {
          next(error);
        }
      });

    //
    // static methods
    //

    // api
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
                  if (result) {
                    var response = {};
                    response[prop] = result;
                    res.json(response);
                  }
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
          new_element.edited = Date.now();

          for (var param in apiModel.state.independent) {
            if (req.body[param]) {
              new_element[param] = req.body[param];
            }
          }

          new_element.grantUserAccess((apiModel.create && apiModel.create.creatorAccess) || ['root'], req.user)
          .then(function(element) {
            if (apiModel.create && apiModel.create.handler) {
              return apiModel.create.handler.apply(element, [req, res]);
            } else {
              return element.save();
            }
          })
          .then(function(element) {
            if (element) {
              var response = {};

              response[model] = element;

              res.json(response);
            }
          })
          .catch(function(error) {
            next(error);
          });
        } catch (error) {
          next(error);
        }
      });

    // full or partial update of the resource state
    if (secure['update']) {
      router.patch('/:id',
        bodyParser.json(),
        bodyParser.urlencoded({
          extended: false
        }),
        userAuth(),
        apiMiddleware,
        function(req, res, next) {
          try {

            Model.findById('' + req.params.id)
            .exec()
            .then(function(element) {
              // this will blow up the request if there is not proper permission
              if (!element.testAccess('update', req.user)) {
                throw new ModelError('noaccess',
                  'User does not have permission to [0] this [1].', ['update', model],
                  403);
              }

              element.edited = Date.now();

              for (var param in apiModel.state.independent) {
                if (req.body[param]) {
                  element[param] = req.body[param];
                }
              }

              var edit_promise;

              if (apiModel.update && apiModel.update.handler) {
                return apiModel.update.handler.apply(element, [req, res]);
              } else {
                return element.save();
              }
            })
            .then(function(element) {
              // broadcast that the resource has changed to anyone in the channel
              // and the time that the edit happened
              element.event('changed', element.edited);
              if (element) {
                var response = {};

                response[model] = element;

                res.json(response);
              }
            })
            .catch(function(error) {
              next(error);
            });
          } catch (error) {
            next(error);
          }
        });
    } else {
      router.post('/:id',
        bodyParser.json(),
        bodyParser.urlencoded({
          extended: false
        }),
        apiMiddleware,
        function(req, res, next) {
          try {

            Model.findById('' + req.params.id)
            .exec()
            .then(function(element) {

              element.edited = Date.now();

              for (var param in apiModel.state.independent) {
                if (req.body[param]) {
                  element[param] = req.body[param];
                }
              }

              var edit_promise;

              if (apiModel.update && apiModel.update.handler) {
                edit_promise = apiModel.update.handler.apply(element, [req]);
              } else {
                edit_promise = element.save();
              }

              return edit_promise;
            })
            .then(function(element) {
              element.event('changed', element.edited);

              var response = {};

              response[model] = element;

              res.json(response);
            })
            .catch(function(error) {
              next(error);
            });
          } catch (error) {
            next(error);
          }
        });
    }



    // retrieve the resource
    if (secure['get']) {
      router.get('/:id',
        bodyParser.json(),
        bodyParser.urlencoded({
          extended: false
        }),
        userAuth(),
        apiMiddleware,
        function(req, res, next) {
          try {
            var query = Model.findById('' + req.params.id);

            if (apiModel.get && apiModel.get.populate) {
              query = query.populate.apply(query, apiModel.get.populate);
            }

            query.exec()
            .then(function(element) {
              if (element.deleted) {
                throw new ModelError('removed',
                  'This [0] has been peranently removed.', [model],
                  410);
              }

              if (element.flagged) {
                throw new ModelError('flagged',
                  'This [0] has been flagged for review and is temporarily unavailable.', [model],
                  503);
              }

              if (!element.testAccess('get', req.user)) {
                throw new ModelError('noaccess',
                  'User does not have permission to [0] this [1].', ['get', model],
                  403);
              }

              if (apiModel.get && apiModel.get.handler) {
                return apiModel.get.handler.apply(element, [req, res]);
              } else {
                return element;
              }

            })
            .then(function(element) {
              if (element) {
                var response = {};
                response[model] = element;

                res.json(response);
              }
            })
            .catch(function(error) {
              next(error);
            });
          } catch (error) {
            next(error);
          }
        });
    } else {
      router.get('/:id',
        bodyParser.urlencoded({
          extended: false
        }),
        apiMiddleware,
        function(req, res, next) {
          try {
            var query = Model.findById('' + req.params.id);

            if (apiModel.get && apiModel.get.populate) {
              query = query.populate.apply(query, apiModel.get.populate);
            }

            query.exec()
            .then(function(element) {
              if (element.deleted) {
                throw new ModelError('removed',
                  'This [0] has been peranently removed.', [model],
                  410);
              }

              if (element.flagged) {
                throw new ModelError('flagged',
                  'This [0] has been flagged for review and is temporarily unavailable.', [model],
                  503);
              }

              var response = {};
              response[model] = element;

              res.json(response);
            })
            .catch(function(error) {
              next(error);
            });
          } catch (error) {
            next(error);
          }
        });
    }



    //
    // Add exposed api safe methods
    //

    for (var prop in apiModel.safe) {
      if (prop === 'secure') {
        continue;
      }

      (function(prop, method) {
        // perform a 'get' api call to the resource
        var route = '/:id/' + prop + (method.parameter ? '/' + method.parameter : '');

        if (secure['safe']) {
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
                  query = query.populate.apply(query, method.populate);
                }

                query.exec()
                .then(function(element) {

                  if (!element.testAccess('safe', req.user)) {
                    throw new ModelError('noaccess',
                      'User does not have permission to [0] this [1].', ['safe.' + prop, model],
                      403);
                  }

                  return method.handler.apply(element, [req, res]);
                })
                .then(function(result) {

                  if (result) {
                    // if something was returned, assume that
                    // the response has not been sent yet. so
                    // send whatever is the result
                    var response = {};
                    response[prop] = result;
                    res.json(response);
                  }


                })
                .catch(function(error) {
                  next(error);
                });
              } catch (error) {
                next(error);
              }
            });
        } else if (secure['safe.' + prop]) {
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
                  query = query.populate.apply(query, method.populate);
                }

                query.exec()
                .then(function(element) {

                  if (!element.testAccess('safe.' + prop, req.user)) {
                    throw new ModelError('noaccess',
                      'User does not have permission to [0] this [1].', ['safe.' + prop, model],
                      403);
                  }

                  return method.handler.apply(element, [req, res]);
                })
                .then(function(result) {
                  if (result) {
                    // if something was returned, assume that
                    // the response has not been sent yet. so
                    // send whatever is the result
                    var response = {};
                    response[prop] = result;
                    res.json(response);
                  }
                })
                .catch(function(error) {
                  next(error);
                });
              } catch (error) {
                next(error);
              }
            });
        } else {
          router.get(route,
            bodyParser.urlencoded({
              extended: false
            }),
            apiMiddleware,
            function(req, res, next) {
              try {
                var query = Model.findById('' + req.params.id);

                if (method.populate) {
                  query = query.populate.apply(query, method.populate);
                }

                query.exec()
                .then(function(element) {
                  return method.handler.apply(element, [req, res]);
                })
                .then(function(result) {
                  if (result) {
                    // if something was returned, assume that
                    // the response has not been sent yet. so
                    // send whatever is the result
                    var response = {};
                    response[prop] = result;
                    res.json(response);
                  }
                })
                .catch(function(error) {
                  next(error);
                });
              } catch (error) {
                next(error);
              }
            });
        }
      })(prop, apiModel.safe[prop]);
    }

    //
    // unsafe methods
    //

    for (var prop in apiModel.unsafe) {
      if (prop === 'secure') {
        continue;
      }

      // perform a 'post' api call to the resource
      (function(prop, method) {
        var route = '/:id/' + prop + (method.parameter ? '/' + method.parameter : '');

        // perform a 'get' api call to the resource
        if (secure['unsafe']) {
          router.patch(route,
            bodyParser.urlencoded({
              extended: false
            }),
            userAuth(),
            apiMiddleware,
            function(req, res, next) {
              try {
                var query = Model.findById('' + req.params.id);

                if (method.populate) {
                  query = query.populate.apply(query, method.populate);
                }

                query.exec()
                .then(function(element) {
                  if (!element.testAccess('unsafe', req.user)) {
                    throw new ModelError('noaccess',
                      'User does not have permission to [0] this [1].', ['unsafe.' + prop, model],
                      403);
                  }

                  return method.handler.apply(element, [req, res]);
                })
                .then(function(result) {
                  if (result) {
                    // if something was returned, assume that
                    // the response has not been sent yet. so
                    // send whatever is the result
                    var response = {};
                    response[prop] = result;
                    res.json(response);
                  }
                })
                .catch(function(error) {
                  next(error);
                });
              } catch (error) {
                next(error);
              }
            });
        } else if (secure['unsafe.' + prop]) {
          router.patch(route,
            bodyParser.urlencoded({
              extended: false
            }),
            userAuth(),
            apiMiddleware,
            function(req, res, next) {
              try {
                var query = Model.findById('' + req.params.id);

                if (method.populate) {
                  query = query.populate.apply(query, method.populate);
                }

                query.exec()
                .then(function(element) {

                  if (!element.testAccess('unsafe.' + prop, req.user)) {
                    throw new ModelError('noaccess',
                      'User does not have permission to [0] this [1].', ['unsafe.' + prop, model],
                      403);
                  }

                  return method.handler.apply(element, [req, res]);
                })
                .then(function(result) {
                  if (result) {
                    // if something was returned, assume that
                    // the response has not been sent yet. so
                    // send whatever is the result
                    var response = {};
                    response[prop] = result;
                    res.json(response);
                  }
                })
                .catch(function(error) {
                  next(error);
                });
              } catch (error) {
                next(error);
              }
            });
        } else {
          router.patch(route,
            bodyParser.urlencoded({
              extended: false
            }),
            apiMiddleware,
            function(req, res, next) {
              try {
                var query = Model.findById('' + req.params.id);

                if (method.populate) {
                  query = query.populate.apply(query, method.populate);
                }

                query.exec()
                .then(function(element) {
                  return method.handler.apply(element, [req, res]);
                })
                .then(function(result) {
                  if (result) {
                    // if something was returned, assume that
                    // the response has not been sent yet. so
                    // send whatever is the result
                    var response = {};
                    response[prop] = result;
                    res.json(response);
                  }
                })
                .catch(function(error) {
                  next(error);
                });
              } catch (error) {
                next(error);
              }
            });
        }
      })(prop, apiModel.unsafe[prop]);
    }


    server.express.use('/api/' + model, router);

    //
    // Create the necessary route/event handlers for websocket connections
    // to this resource.
    //

    var ioroute = server.io.of('/' + model);

    ioroute.on('connect', function(socket) {
      try {
        user_ioAuth(socket);

        // listen for changes to a particular resource.
        socket.on('listen', function(data) {
          Model.findById('' + data._id)
            .exec()
            .then(function(element) {
              if (!element.testAccess('get', req.user)) {
                throw new ModelError('noaccess',
                  'User does not have permission to [0] this [1].', ['get', model],
                  403);
              }

              socket.join(model + "_" + element._id);
            })
            .catch(function(error) {
              socket.emit('error', error);
            });
        });

        socket.on('leave', function(data) {
          socket.leave(model + "_" + data._id);
        });

      } catch (error) {
        socket.emit('error', error);
      }

    });

  }
};

module.exports = function(serverInstance) {
  server = serverInstance;

  server.express.get('/api', function(req, res, next) {
    try {
      res.json(jsonApi);
    } catch (error) {
      next(error);
    }
  });

  return {
    addModels: addModels
  };
};
