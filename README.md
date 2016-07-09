## Hilt
=====

A work-in-progress basis for a style of website framework.

MongoDB -> mongoose
Express
Socket.io

These libraries are wrapped by apifactory. The routes are inferred from
the nesting of the key-value pairs in the model definition files. The route handlers
are then the end-point of the route, with the necessary middleware added before them.

It also adds the layer of user authentication and permission handling, which can
be configured from the model definition. socket.io is used as signalling to subscribers
to be updated upon state change of models.

ReactJS

Front-End components are defined using reactJS components, and are
bundled and served using webpack. http and socket.io commication with the server is
wrapped in the journal module, which implements a subscription service.

#### Example Model Definition: modelName.js

    var Promise = require('bluebird');

    module.exports = function(api) {
      var modelVariable;

      return {
        // This model will be referenced on both server and client by this name
        modelName: {
          // these will be stored in the database (in a separate collection) and reloaded upon startup
          settings: {
            someSetting: ''
          },
          // function called upon server start and upon (possible) setting changes
          configure: function(){

            if (!api.modelName.settings.someSetting) {
              console.log("modelName has not been configured.");
              return;
            }

            modelVariable = api.modelName.settings.someSetting + 'additional processing';
          },
          // This adds to the database Schema the data to store using the same
          // syntax as mongoose Schemas
          state: {
            // the fields independent/dependent will not be separated within
            // the database schema. This only separates which fields have to be
            // changed functionally.
            independent: {
              // data which can be directly set without regard to side-effects
              // api.types is set using mongoose.Schema.Types so you don't need to include it explicitly
              objRefData: {
                type: api.types.ObjectId,
                ref: 'account'
              },
              textData: {
                type: String,
                default: ''
              },
              tag: {
                type: String,
                required: true
              }
            },
            dependent: {
              // data which are set because of side-effects either from
              // methods directly on this model, or from external effects
              externallyUpdatedBoolean: {
                type: Boolean,
                default: false
              },
            },
            // index to use to make queries more efficient
            index: {
              textData: 'text',
            }
          },
          static: {
            action: {
              // model instance creation options
              // -> POST /api/modelName
              root: {
                // optional access permissions the creator of an instance
                // if ommited, the creator will get root access to the instance
                creatorAccess: ['root'],
                // optional custom route handler on creation of an instance.
                // the instance must be saved within the handler if a handler is used.
                // if a value (or promise) is returned, that value is returned to the response
                // if nothing is returned, then nothing is sent in the response as it
                // assumed the response was handled in the handler
                handler: function(req, res) {
                  // the this variable refers to the mongoose object of the instance
                  var instance = this;
                  // do stuff, like grand permissions to someone else
                  // here, grantUser_id is supplied in the request to grant access to.
                  // grantUserAccess automatically saves the instance
                  //
                  return api.user.collection.findById(req.body.grantUser_id)
                  .then(function(user){
                    if (!user){
                      throw new api.modelName.Error('nouser',
                        'The user could not be found.', [],
                        404);
                    }

                    // the action.boolean corresponds to POST: api/modelName/:id/boolean
                    return instance.grantUserAccess('action.boolean', user);
                  });
                }
              },
            },
            view: {
              // -> GET /api/modelName/search/:tag
              search: {
                parameter: ':tag(*)',
                handler: function(req, res) {
                  return api.modelName.collection.find({
                    tag: req.params.tag
                  });
                }
              }
            }
          },
          view: {
            // -> GET /api/modelName/:_id
            root: {
              // Optional security limits access to those in the access list for 'get'
              // If no security, anyone may call this route
              security: true,
              // can specify population of other models from reference ids
              populate: ['objRefData'],
              // Optional custom route handler for get method
              // if a value (or promise) is returned, that value is returned to the response
              // if nothing is returned, then nothing is sent in the response as it
              // assumes the response was handled in the handler
              handler: function(req, res) {
                var that = this;
                // whatever is returned from this function is sent to client
                return new Promise(function(resolve, reject) {
                  // async operations returned as a promise;
                  return that;
                });
              }
            },
            // -> GET /api/modelName/:_id/similar
            similar: {
              // anyone can call this route since security is disabled
              security: false,

              // whatever is returned from the handler is returned to the response
              // if nothing is returned, then it is assumed the response was already
              // handled by the handler
              handler: function(req, res) {
                var instance = this;

                return api.modelName.collection.find({
                  tag: instance.tag
                });
              }
            }
          }
          action: {
            // -> POST /api/modelName/:_id
            root: {
              // optional security can be used to limit access to the 'update' list
              security: true,
              // Optional custom route handler for update method
              // the instance must save changes within the handler if a handler is used
              // if a value (or promise) is returned, that value is returned to the response
              // if nothing is returned, then nothing is sent in the response as it
              // assumes the response was handled in the handler
              handler: function(req, res) {
                if (this.externallyUpdatedBoolean) {
                  // restrict update to only if this state is false
                  throw new api.modelName.Error('updatenotallowed',
                    'Update of [0] not allowed at this time.', // template message
                    [this.textData], // template values to insert at runtime
                    405); // send a status code
                }

                return this.save();
              }
            },
            // -> POST /api/modelName/:_id/boolean?value=#
            // sets the boolean value in the database by calling a helper function
            boolean: {
              security: true,
              handler: function(req, res) {
                return this.setBoolean(req.query.value);
              }
            },
            // -> POST /api/modelName/:_id/delete
            // 'delete' the data with _id
            // One expecting a REST api would expect delete to be handled by the http DELETE operation, not POST.
            // However, this api is not used as a REST api. It is used to log actions, where the
            // actions are resources and defined by a url, not the http method used. POST is used for reporting all actions, therefore it
            // is also used for deleting something whenever the delete action is reported.
            delete: {}
          },
          internal: {
            // custom helper methods that can only be called on the server from an instance
            setBoolean: function(value) {
              this.externallyUpdatedBoolean = value;
              return this.save();
            }
          }
        }
      };
    };


#### Example React and journal subscription

    import React from 'react';
    import * as Bootstrap from 'react-bootstrap';
    import * as journal from '../journal';
    import { Router, Route, Link, browserHistory  } from 'react-router';

    export default React.createClass({
      componentWillMount: function(){

        // subscribe to a search using a variable tag
        this.subscription = journal.subscribe({
          search: 'api/modelName/search/{this.state.tag}'
        }, state => {
          this.setState(state);
        }, this);

      },
      componentWillUnmount: function(){
        // cancel subscription when component goes away
        this.subscription.unsubscribe();
      },
      handleTag(event) {
        // set new state and update subscription
        this.setState({
          tag: event.target.value
        }, this.subscription.thisChanged);
      },
      render() {
        if (this.state.search) {
          return (
            <div>
              <div style={{padding: '1em'}}>
                <Bootstrap.Row>
                  <Bootstrap.Col md={2}>
                    <Bootstrap.Input
                      type="text"
                      value={this.state.tag}
                      onChange={this.handleTag}
                    />
                  </Bootstrap.Col>
                </Bootstrap.Row>
              </div>
              {this.state.search.map(instance => {
                return (
                  <div key={instance._id} style={{padding: '1em'}}>
                    <Link to={'/modelName/' + instance._id}>{instance.textData}</Link>
                  </div>
                );
              })}
            </div>
          );
        }

        return (
          <div>
            <Bootstrap.Row>
              <Bootstrap.Col md={2}>
                <Bootstrap.Input
                  type="text"
                  value={this.state.tag}
                  onChange={this.handleTag}
                />
              </Bootstrap.Col>
            </Bootstrap.Row>
          </div>
        );
      }
    });
