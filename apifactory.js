/**
 *
 * Factory for producing REST and mongoose models for general resources.
 *
 */
"use strict";

var express = require('express');
var mongoose = require('mongoose');
var userAuth = require('./middleware/user');
var user_ioAuth = require('./middleware/user_io');

var error = require('./error');
var _ = require('lodash');
var url = require('url');

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

// returns a new api which has merged the properties of the two api supplied.
// the merging takes place at the named view/action level, as well as the members
// in the state. the second api takes precedence, so if both api contain the same
// view/action/state, then the definition supplied in the second one will be used.
var combineApiModels = function(api1, api2) {

  var result = {};
  var param;

  // combine settings
  if (api1.settings || api2.settings) {
    result.settings = {};

    if (api1.settings) {
      for(var setting in api1.settings) {
        result.settings[setting] = api1.settings[setting];
      }
    }

    if (api2.settings) {
      for(var setting in api2.settings) {
        result.settings[setting] = api2.settings[setting];
      }
    }
  }

  // combine configure functions
  if (api1.configure && api2.configure) {
    result.configure = function(settings) {
      api1.configure(settings);
      api2.configure(settings);
    };
  }else{
    result.configure = api1.configure || api2.configure;
  }

  // combine state
  if (api1.state || api2.state) {
    result.state = {};

    if (api1.state.independent || api2.state.independent){
      result.state.independent = {};

      if (api1.state && api1.state.independent){
        for (param in api1.state.independent) {
          result.state.independent[param] = api1.state.independent[param];
        }
      }

      if (api2.state && api2.state.independent){
        for (param in api2.state.independent) {
          result.state.independent[param] = api2.state.independent[param];
        }
      }
    }

    if (api1.state.dependent || api2.state.dependent){
      result.state.dependent = {};

      if (api1.state && api1.state.dependent){
        for (param in api1.state.dependent) {
          result.state.dependent[param] = api1.state.dependent[param];
        }
      }

      if (api2.state && api2.state.dependent){
        for (param in api2.state.dependent) {
          result.state.dependent[param] = api2.state.dependent[param];
        }
      }
    }
  }

  // combine static views and actions
  if (api1.static || api2.static) {
    result.static = {};

    if (api1.static.view || api2.static.view){
      result.static.view = {};

      if (api1.static && api1.static.view){
        for (param in api1.static.view) {
          result.static.view[param] = api1.static.view[param];
        }
      }

      if (api2.static && api2.static.view){
        for (param in api2.static.view) {
          result.static.view[param] = api2.static.view[param];
        }
      }
    }

    if (api1.static.action || api2.static.action){
      result.static.action = {};

      if (api1.static && api1.static.action){
        for (param in api1.static.action) {
          result.static.action[param] = api1.static.action[param];
        }
      }

      if (api2.static && api2.static.action){
        for (param in api2.static.action) {
          result.static.action[param] = api2.static.action[param];
        }
      }
    }
  }

  // combine instance views
  if (api1.view || api2.view){
    result.view = {};

    if (api1.view){
      for (param in api1.view) {
        result.view[param] = api1.view[param];
      }
    }

    if (api2.view){
      for (param in api2.view) {
        result.view[param] = api2.view[param];
      }
    }
  }

  // combine instance actions
  if (api1.action || api2.action){
    result.action = {};

    if (api1.action){
      for (param in api1.action) {
        result.action[param] = api1.action[param];
      }
    }

    if (api2.action){
      for (param in api2.action) {
        result.action[param] = api2.action[param];
      }
    }
  }

  // combine internal methods
  if (api1.internal || api2.internal){
    result.internal = {};

    if (api1.internal){
      for (param in api1.internal) {
        result.internal[param] = api1.internal[param];
      }
    }

    if (api2.internal){
      for (param in api2.internal) {
        result.internal[param] = api2.internal[param];
      }
    }
  }

  return result;
}

var api = {};
api.types = mongoose.Schema.Types;

var addModels = function(create) {

  var models = create(api);

  for (var model in models) {

    if (api[model]) {
      // if there is already a definition for this model, it needs to be
      // merged with the new one.
      api[model] = combineApiModels(api[model], models[model]);
    }else{
      api[model] = models[model];
    }

  }
};

var serveModels = function(server){
  var jsonApi = {};
  var subscriptions = new Map();

  for (var model in api) {
    if (model === 'types') {
      continue;
    }

    (function(model, apiModel){

      var ModelError = error('routes.api.' + model);
      apiModel.Error = ModelError;

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
        deleted: {
          type: Number,
          default: 0
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
            throw new Error('All views for ' + model + ' were made secure, so independently setting view.' + prop + ' is not allowed.');
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
            throw new Error('All actions for ' + model + ' were made secure, so independently setting action.' + prop + ' is not allowed.');
          }

          secure['action.' + prop] = true;
        }
      }

      if (apiModel.state) {
        // add custom shema to the model
        if (apiModel.state.independent) {
          for (var param in apiModel.state.independent) {
            schema[param] = apiModel.state.independent[param];
          }
        }

        if (apiModel.state.dependent) {
          for (var param in apiModel.state.dependent) {
            schema[param] = apiModel.state.dependent[param];
          }
        }
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


        this.edited = Date.now();
        return this.save().then(function(instance){
          var modelSub = subscriptions.get(model);

          if (modelSub){
            var instanceSub = modelSub.instances.get('' + instance._id);

            if (instanceSub) {
              instanceSub.subscribers.forEach(function(subscription, key){
                subscription();
              });
            }
          }

          return instance;
        });
      };

      Schema.methods.deleteEvent = function() {

        this.deleted = Date.now();

        return this.save().then(function(instance){
          var modelSub = subscriptions.get(model);

          if (modelSub){
            var instanceSub = modelSub.instances.get('' + instance._id);

            if (instanceSub) {
              instanceSub.subscribers.forEach(function(subscription, key){
                subscription();
              });
            }
          }

          return instance;
        });
      };

      apiModel.editEvent = function() {

        var modelSub = subscriptions.get(model);

        if (modelSub){
          modelSub.subscribers.forEach(function(subscription, key){
            subscription();
          });

          modelSub.instances.forEach(function(instance){
            instance.subscribers.forEach(function(subscription, key){
              subscription();
            });
          });
        }
      };

      Schema.methods.testAccess = function(action, user) {

        if (this.deleted) {
          throw new ModelError('deleted',
            'This [0] has been permanently deleted.', [model],
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

      // this is technically the mongoose constructor, but the api is doing its own
      // thing, and from now on the methods (besides constructor) are used as if this
      // is a reference to the collection itself in the db that mongoose is connected to.
      // everyone else must use the .create function to contruct a new instance, not new Model
      apiModel.collection = Model;

      // use this for creating new instances
      apiModel.create = function(data, user, creatorAccess) {
        if (model === 'user') {
          var new_user = new Model();

          new_user.created = Date.now();

          if (data){
            for (var param in apiModel.state.independent) {
              if (typeof data[param] !== 'undefined') {
                new_user[param] = data[param];
              }
            }
          }

          return new_user.grantUserAccess(creatorAccess || ['root'], new_user);
        }

        if (!user) {
          throw new ModelError('nouser',
            'A user must be logged in to add a [0].', [model],
            401);
        }

        var new_element = new Model();

        new_element.created = Date.now();

        if (data){
          for (var param in apiModel.state.independent) {
            if (typeof data[param] !== 'undefined') {
              new_element[param] = data[param];
            }
          }
        }

        return new_element.grantUserAccess(creatorAccess || ['root'], user);
      };

      var apiHandle = {
        settings: {}
      };

      //
      // Make a pure json format string of Model
      //
      var jsonModel = {
        state: {
          independent: {},
          dependent: {}
        },
        static: {
          view: {},
          action: {}
        },
        view: {},
        action: {},
        secure: secure
      };

      jsonApi[model] = jsonModel;

      jsonModel.settings = apiModel.settings || {};

      for (var prop in apiModel.static.view) {
        jsonModel.static.view[prop] = {};
      }

      for (var prop in apiModel.static.action) {
        jsonModel.static.action[prop] = {};
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

      //
      // Static Views
      //
      if (apiModel.static && apiModel.static.view){

        for (var prop in apiModel.static.view) {

          (function(prop, method) {
            var route;
            if (prop === 'root') {
              route = '/';
            }else{
              route = '/' + prop + (method.parameter ? '/' + method.parameter : '');
            }

            router.get(route,
              bodyParser.urlencoded({
                extended: false
              }),
              function(req, res, next) {
                try {
                  Promise.all([method.handler.apply(null, [req, res])])
                  .then(function(result) {
                    if (result[0]) {
                      res.json(result[0]);
                    }

                    // if there is no result, assume handler handled response
                  })
                  .catch(function(error) {
                    next(error);
                  });
                } catch (error) {
                  next(error);
                }
              });
          })(prop, apiModel.static.view[prop]);

        }
      }

      //
      // Static Actions
      //
      if (apiModel.static && apiModel.static.action){

        for (var prop in apiModel.static.action) {

          (function(prop, method) {
            var route;
            if (prop === 'root') {
              route = '/';
            }else{
              route = '/' + prop + (method.parameter ? '/' + method.parameter : '');
            }

            router.post(route,
              bodyParser.json(),
              bodyParser.urlencoded({
                extended: false
              }),
              userAuth(),
              function(req, res, next) {
                try {
                  if (prop === 'root') {
                    // the root static action is also the default creation action
                    if (!req.user && model !== 'user') {
                      throw new ModelError('nouser',
                        'A user must be logged in to add a [0].', [model],
                        401);
                    }

                    return apiModel.create(req.body, req.user, method.creatorAccess)
                    .then(function(element) {
                      if (method.handler) {
                        var result = method.handler.apply(element, [req, res]);

                        if (result) {
                          return Promise.all([result]).then(function(result) {
                            return element.editEvent().save()
                            .then(function(){
                              res.json(result[0] || {_id: element._id});
                            });
                          });
                        }

                        // if there is no result, assume handler handled response
                        // no additional response is given.
                        return element.editEvent().save();
                      }

                      return element.editEvent().save()
                      .then(function(element){
                        // default at least reaturn the id so it can be found immediatly
                        res.json({
                          _id: element._id
                        });
                      });
                    })

                    .catch(function(error){
                      next(error);
                    });
                  }

                  if (method.handler) {
                    var result = method.handler.apply(null, [req, res]);

                    if (result) {
                      return Promise.all([result]).then(function(result) {
                        if (result[0]) {
                          res.json(result[0]);
                        }

                        // if there is no result, assume handler handled response
                      })
                      .catch(function(error){
                        next(error);
                      });
                    }

                    // if there is no result, assume handler handled response
                    return;
                  }

                  res.json({});

                } catch (error) {
                  next(error);
                }
              });
          })(prop, apiModel.static.action[prop]);

        }
      }

      //
      // Instance Views
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
                    if (!element) {
                      throw new ModelError('notfound',
                        'A [1] with id = [0] could not be found.', [req.params.id, model],
                        404);
                    }

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
                    if (result) {
                      res.json(result);
                    }
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
                    if (!element) {
                      throw new ModelError('notfound',
                        'A [1] with id = [0] could not be found.', [req.params.id, model],
                        404);
                    }

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
                    if (result) {
                      res.json(result);
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
            // there is no security for this view so no need to authenticate requests
            router.get(route,
              bodyParser.urlencoded({
                extended: false
              }),
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
                    if (!element) {
                      throw new ModelError('notfound',
                        'A [1] with id = [0] could not be found.', [req.params.id, model],
                        404);
                    }

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
                    if (result) {
                      res.json(result);
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
        })(prop, apiModel.view[prop]);
      }

      //
      // Instance Actions
      //

      for (var prop in apiModel.action) {
        if (prop === 'secure') {
          // this is not a route, just saying whether all action routes are secure or not
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
            // all of these action requests must be authenticated
            router.post(route,
              bodyParser.json(),
              bodyParser.urlencoded({
                extended: false
              }),
              userAuth(),
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
                    if (!element) {
                      throw new ModelError('notfound',
                        'A [1] with id = [0] could not be found.', [req.params.id, model],
                        404);
                    }

                    if (!element.testAccess('action', req.user)) {
                      throw new ModelError('noaccess',
                        'User does not have permission to [0] this [1].', ['action', model],
                        403);
                    }

                    if (prop === 'root') {
                      for (var param in apiModel.state.independent) {
                        // update any independent fields that were supplied directly
                        // in the request
                        if (typeof req.body[param] !== 'undefined') {

                          element[param] = req.body[param];
                        }
                      }
                    }

                    if (prop === 'delete') {
                      if (method.handler) {
                        var result = method.handler.apply(element, [req, res]);

                        if (result) {
                          // assumes a promise is returned, if anything
                          return Promise.all([result]).then(function(results) {
                            return element.deleteEvent().return(results[0] || null);
                          });
                        }
                      }

                      return element.deleteEvent();
                    }

                    if (method.handler) {
                      var result = method.handler.apply(element, [req, res]);

                      if (result) {
                        // assumes a promise is returned, if anything
                        return Promise.all([result]).then(function(results) {
                          return element.editEvent().return(results[0] || null);
                        });
                      }
                    }

                    return element.editEvent();
                  })
                  .then(function(result) {
                    if (result) {
                      res.json(result);
                    }
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
                    if (!element) {
                      throw new ModelError('notfound',
                        'A [1] with id = [0] could not be found.', [req.params.id, model],
                        404);
                    }

                    if (!element.testAccess('action.' + prop, req.user)) {
                      throw new ModelError('noaccess',
                        'User does not have permission to [0] this [1].', ['action.' + prop, model],
                        403);
                    }

                    if (prop === 'root') {

                      for (var param in apiModel.state.independent) {
                        // update any independent fields that were supplied directly
                        // in the request
                        if (typeof req.body[param] !== 'undefined') {
                          element[param] = req.body[param];
                        }
                      }
                    }

                    if (prop === 'delete') {
                      if (method.handler) {
                        var result = method.handler.apply(element, [req, res]);

                        if (result) {
                          // assumes a promise is returned, if anything
                          return Promise.all([result]).then(function(results) {
                            return element.deleteEvent().return(results[0] || null);
                          });
                        }
                      }

                      return element.deleteEvent();
                    }

                    if (method.handler) {
                      var result = method.handler.apply(element, [req, res]);

                      if (result) {
                        // assumes a promise is returned, if anything
                        return Promise.all([result]).then(function(results) {
                          return element.editEvent().return(results[0] || null);
                        });
                      }
                    }

                    return element.editEvent();
                  })
                  .then(function(result) {
                    if (result) {
                      res.json(result);
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
            router.post(route,
              bodyParser.json(),
              bodyParser.urlencoded({
                extended: false
              }),
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
                    if (!element) {
                      throw new ModelError('notfound',
                        'A [1] with id = [0] could not be found.', [req.params.id, model],
                        404);
                    }

                    if (!element.testAccess('action')) {
                      throw new ModelError('noaccess',
                        'User does not have permission to [0] this [1].', ['action', model],
                        403);
                    }

                    if (prop === 'root') {
                      for (var param in apiModel.state.independent) {
                        // update any independent fields that were supplied directly
                        // in the request
                        if (typeof req.body[param] !== 'undefined') {
                          element[param] = req.body[param];
                        }
                      }
                    }

                    if (prop === 'delete') {
                      if (method.handler) {
                        var result = method.handler.apply(element, [req, res]);

                        if (result) {
                          // assumes a promise is returned, if anything
                          return Promise.all([result]).then(function(results) {
                            return element.deleteEvent().return(results[0] || null);
                          });
                        }
                      }

                      return element.deleteEvent();
                    }

                    if (method.handler) {
                      var result = method.handler.apply(element, [req, res]);

                      if (result) {
                        // assumes a promise is returned, if anything
                        return Promise.all([result]).then(function(results) {
                          return element.editEvent().return(results[0] || null);
                        });
                      }
                    }

                    return element.editEvent();
                  })
                  .then(function(result) {
                    if (result) {
                      res.json(result);
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
        })(prop, apiModel.action[prop]);
      }


      server.express.use('/api/' + model, router);

    })(model, api[model]);
  }

  // now that all models are loaded, load any settings which are present in the database
  if (api.admin) {
    api.admin.collection.findOne().exec()
    .then(function(admin){
      if (admin) {
        admin.configure();
      }
    });

  }

  server.express.get('/api', function(req, res, next) {
    try {
      res.json(jsonApi);
    } catch (error) {
      next(error);
    }
  });

  server.express.get('/api/:model(*)', function(req, res, next) {
    try {
      if (req.params.model) {
        res.json(jsonApi[req.params.model]);
      }else{
        res.json(jsonApi);
      }
    } catch (error) {
      next(error);
    }
  });

  //
  // Create the necessary route/event handlers for websocket connections
  // to this resource.
  //

  server.io.on('connect', function(socket) {
    try {
      user_ioAuth(socket);

      var subs = {};

      // listen for changes to a particular resource.
      var sub = function(data) {

        try{
          // parse uri to the resource that wants to be listened to
          var parts = data.uri.split('/');
          var model, _id, view;

          model = parts[1];

          // make sure the model can be handled
          if (!api[model]) {
            throw new Error('nomodel',
              'The [0] model is not defined within the api.', [model],
              404);
          }

          if (/[a-z0-9]{24}/.test(parts[2])) {
            // there is a 12byte _id, so this is an instance

            _id = parts[2];
            view = parts[3] || 'root';

            // find the data for this model instance
            api[model].collection.findById(_id)
            .exec()
            .then(function(element) {
              // first make sure they have permission to even see this instance view
              // using the security settings
              if (!element.testAccess('view.' + view, socket.user)) {
                throw new api[model].Error('noaccess',
                  'User does not have permission to [0] this [1].', ['view.' + view, model],
                  403);
              }

              // get/create the subscription node for that model in question
              var modelSub = subscriptions.get(model);

              if (!modelSub) {
                modelSub = {
                  subscribers: new Map(),
                  instances: new Map()
                };

                // create subscription
                subscriptions.set(model, modelSub);
              }

              // get/create the subscription node for that instance in question
              var instanceSub = modelSub.instances.get(_id);

              if (!instanceSub) {
                instanceSub = {
                  subscribers: new Map()
                };

                // create subscription
                modelSub.instances.set(_id, instanceSub);
              }

              // the key is set to the socket id (not user, since the same user could have multiple connections)
              // the view is included because a socket could be subscribed to multiple views
              // of the same instance, and must have separate update events sent.
              instanceSub.subscribers.set(socket.id + '/' + data.uri, function(){
                // callback when there is a change with the instance subscribed to
                socket.emit('api_update', {
                  uri: data.uri
                });
              });


              // this is for cleanup on disconnect
              subs[data.uri] = true;

            })
            .catch(function(error) {
              socket.emit('api_error', error);
            });
          }else {

            // get/create the subscription node for that model in question
            var modelSub = subscriptions.get(model);

            if (!modelSub) {
              modelSub = {
                subscribers: new Map(),
                instances: new Map()
              };

              // create subscription
              subscriptions.set(model, modelSub);
            }

            // this one will just be listening for updates to a whole collection
            modelSub.subscribers.set(socket.id + '/' + data.uri, function(){
              // callback when there is a change with the instance subscribed to
              socket.emit('api_update', {
                uri: data.uri
              });
            });

            // this is for cleanup on disconnect
            subs[data.uri] = true;
          }
        }catch(error){
          socket.emit('api_error', error);
        }
      };

      var unsub = function(data) {
        try{

          var parts = data.uri.split('/');
          var model, _id, view;
          var key, sub;

          model = parts[1];

          var modelSub = subscriptions.get(model);

          if (modelSub) {

            if (/[a-z0-9]{24}/.test(parts[2])) {
              // there is an 12byte _id, so this is an instance
              _id = parts[2];

              var instanceSub = modelSub.instances.get(_id);

              if (instanceSub) {
                instanceSub.subscribers.delete(socket.id + '/' + data.uri);

                if (instanceSub.subscribers.size === 0) {
                  // remove since noone is listening
                  modelSub.instances.delete(_id);
                }
              }

            }else{
              modelSub.subscribers.delete(socket.id + '/' + data.uri);
            }

            if (modelSub.subscribers.size === 0 && modelSub.instances.size === 0) {
              subscriptions.delete(model);
            }

          }

          // no longer needs to be cleaned up
          subs[data.uri] = false;

        }catch(error){
          socket.emit('api_error', error);
        }
      };

      var cleanup = function(){
        // remove listeners
        for(var uri in subs) {
          if (subs[uri]){
            unsub({
              uri: uri
            });
          }
        }
      };

      socket.on('subscribe', sub);

      socket.on('unsubscribe', unsub);

      socket.on('disconnect', cleanup);

      socket.on('report', function(data) {

      });

    } catch (error) {
      socket.emit('api_error', error);
    }

  });
};

module.exports = {
  addModels: addModels,
  serveModels: serveModels,
  api: api
};
