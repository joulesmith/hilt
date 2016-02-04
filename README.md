## Hilt
=====

A work-in-progress basis for a style of website framework.

MongoDB
Express

These two libraries are wrapped by apifactory. The routes are inferred from
the nesting of the key-value pairs in the model definition files. The route handlers
are then the end-point of the route, with the necessary middleware added before them.

It also adds the layer of user authentication and permission handling, which can
be configured from the model definition.

ReactJS

Front-End components are defined using reactJS components, and are automatically
bundled and served using webpack.

#### Example Model Definition: modelName.js

    var mongoose = require('mongoose');
    var Promise = require('bluebird');
    var ModelError = require('../error')('routes.api.modelName');

    module.exports = {
        // This model will be referenced on both server and client by this name
        modelName : {
            // This adds to the database Schema the data to store
            state : {
                independent : {
                    // data which can be directly set without regard to side-effects
                    objRefData : { type: mongoose.Schema.Types.ObjectId, ref: 'account'},
                    textData : {type: String, default: ''},
                    tag : {type: String, required: true}
                },
                dependent : {
                    // data which are set because of side-effects either from
                    // methods directly on this model, or from external effects
                    externallyUpdatedBoolean : {type: Boolean, default: false},
                },
                // index to use to make queries more efficient
                index : null,
            },
            // model instance creation options
            // -> POST /api/modelName
            create : {
                // optional access permissions the creator of an instance
                // if ommited, the creator will get root access to the instance
                creatorAccess: ['get'],

                // optional custom route handler on creation of an instance.
                // the instance must be saved within the handler if a handler is used.
                // if a value (or promise) is returned, that value is returned to the response
                // if nothing is returned, then nothing is sent in the response as it
                // assumed the response was handled in the handler
                handler : function(req, res) {
                    // the this variable refers to the mongoose object of the instance
                    var instance = this;
                    // do stuff, like grand permissions to someone else

                    // grantUserAccess automatically saves the instance
                    return instance.grantUserAccess('unsafe.boolean', req.body.grantUser_id);
                }
            },
            // -> GET /api/modelName/:_id
            get : {
                // Optional security limits access to those in the access list for 'get'
                // If no security, anyone may call this route
                security : true,

                // Optional custom route handler for get method
                // if a value (or promise) is returned, that value is returned to the response
                // if nothing is returned, then nothing is sent in the response as it
                // assumes the response was handled in the handler
                handler : function(req, res) {
                    res.send({modelName : "hi"});
                }
            },
            // -> POST /api/modelName/:_id
            update : {
                // optional security can be used to limit access to the 'update' list
                security : true,

                // Optional custom route handler for update method
                // the instance must save changes within the handler if a handler is used
                // if a value (or promise) is returned, that value is returned to the response
                // if nothing is returned, then nothing is sent in the response as it
                // assumes the response was handled in the handler
                handler : function(req, res) {
                    if (this.externallyUpdatedBoolean) {
                        // restrict update to only if this state is false
                        throw new ModelError('updatenotallowed',
                            'Update of [0] not allowed at this time.', // template message
                            [this.textData], // template values to insert at runtime
                            405); // send a status code
                    }

                    return this.save();
                }
            },
            // no restrictions to access, only uses http gets to base url
            static : {
                // -> GET /api/modelName/search/:tag
                search : {
                    parameter : ':tag',
                    handler : function(req, res) {
                        return mongoose.model('modelName').find({
                            tag : req.params.tag
                        });
                    }
                }
            },
            // need execute permission, only uses http gets to specific resource
            safe : {
                // -> GET /api/modelName/:_id/similar
                similar : {
                    // anyone can call this route since security is disabled
                    security : false,

                    // whatever is returned from the handler is returned to the response
                    // if nothing is returned, then it is assumed the response was already
                    // handled by the handler
                    handler : function(req, res) {
                        var instance = this;

                        return mongoose.model('modelName').find({
                            tag : instance.tag
                        });
                    }
                }
            },

            unsafe : {
                // -> POST /api/modelName/:_id/boolean?value=#
                boolean : {
                    security : true,
                    handler : function(req, res) {
                        return this.setBoolean(req.query.value);
                    }
                }
            },

            internal : {
                // custom helper methods that can only be called on the server from an instance
                setBoolean : function(value) {
                    this.externallyUpdatedBoolean = value;
                    return this.save();
                }
            }
        }
    };

#### Example AngularJS controller

    module.controller('exampleController', ['$scope', '$window', '$state', 'apifactory.models', function($scope, $window, $state, models){

        models(['modelName'])
        .then(function(api){

            $scope.create = function(){
                api.modelName.create({
                    tag : 'example'
                })
                .then(function(instance){
                    // do something with new instance of model
                })
                .catch(function(error){
                    // do something with error
                });
            };

        });

    }]);
