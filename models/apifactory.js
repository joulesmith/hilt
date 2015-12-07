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

var User = mongoose.model('user');
var bodyParser = require('body-parser');


module.exports = function(server, models) {

    var formatModel = function(api) {
        var model = {
            authenticate : api.authenticate,
            state : {
                independent : {},
                dependent : {}
            },
            static : {},
            safe : {},
            unsafe : {}
        };

        for(var prop in api.static) {
            model.static[prop] = {};
        }

        for(var prop in api.safe) {
            model.safe[prop] = {};
        }

        for(var prop in api.unsafe) {
            model.unsafe[prop] = {};
        }

        return JSON.stringify(model);
    };

    for(var model in models) {

        var api = models[model];

        var ModelError = error('routes.api.' + model);

        var permission = function(user, resource, action) {
            var i;

            if (!resource.security[action] || !resource.security[action].restricted) {
                // if there is no security, let anyone through
                return;
            }

            // there is security, so a user has to be logged in at least
            if (!user) {
                throw new ModelError('nouser',
                    'A user must be logged in to [0] this [1].',
                    [action, model],
                    401);
            }

            if (user._id.equals(resource.owner)) {
                // the owner can do whatever
                return;
            }

            // implicit attribute that a user has by default
            var user_attribute = 'user_' + user._id;

            var one = resource.security[action].one;
            var all = resource.security[action].all;
            var none = resource.security[action].none;

            if (one.length > 0 && _.indexOf(one, user_attribute, true) === -1) {
                // user needs at least one of these attributes if not directly granted access
                for(i = 0; i < one.length; i++) {
                    if (_.indexOf(user.attributes, one[i], true) !== -1) {
                        break;
                    }
                }

                if (i === one.length) {
                    throw new ModelError('unauthorized',
                        'The user does not possess any of the qualifying attributes.',
                        [],
                        403);
                }
            }

            // a user must have all of these attributes
            for(i = 0; i < all.length; i++) {
                if (_.indexOf(user.attributes, all[i], true) === -1 && user_attribute !== all[i]) {
                    throw new ModelError('unauthorized',
                        'The user does not possess all of the required attributes.',
                        [],
                        403);
                }
            }

            // a user must not have any of these attributes
            for(i = 0; i < none.length; i++) {
                if (_.indexOf(user.attributes, none[i], true) !== -1 || user_attribute === none[i]) {
                    throw new ModelError('unauthorized',
                        'The user possess a disqualifying attribute.',
                        [],
                        403);
                }
            }

            return true;
        };

        //
        // Build the database model using mongoose
        //

        // boilerplate schema for all resource models
        var schema = {

            // time created in unix time [milliseconds]
            created : {type : Number, default: 0},
            // time last edited in unix time [milliseconds]
            edited : {type : Number, default: 0},
            // unavailable until this resource can be reviewed for content
            flagged : {type : Boolean, default : false},
            // no longer can be accessed from public api
            removed : {type : Boolean, default : false},
            owner : { type: mongoose.Schema.Types.ObjectId, ref: 'user'},
            security : {}
        };

        // if a user is not the owner they can still interact with the resource
        // these are a list of qualifying, required, and forbidden attributes
        // a user must satisfy to perform the given class of operation

        // able to do anything an owner can do
        schema.security.manage = {
            one : [{ type: String }],
            all : [{ type: String }],
            none : [{ type: String }]
        };


        // can change something about the resource
        if (api.update && api.update.security) {
            schema.security.update = {
                restricted : {type : Boolean, default : true},
                one : [{ type: String }],
                all : [{ type: String }],
                none : [{ type: String }]
            };
        }

        // can access information about this resource, but cannot alter it in any way
        if (api.get && api.get.security) {
            schema.security.get = {
                restricted : {type : Boolean, default : true},
                one : [{ type: String }],
                all : [{ type: String }],
                none : [{ type: String }]
            };
        }

        if (api.safe && api.safe.security) {
            schema.security.safe = {
                restricted : {type : Boolean, default : true},
                one : [{ type: String }],
                all : [{ type: String }],
                none : [{ type: String }]
            };
        }

        // add method specific security
        for(var prop in api.safe) {
            if (api.safe[prop].security) {
                schema.security['safe.' + prop] = {
                    restricted : {type : Boolean, default : true},
                    one : [{ type: String }],
                    all : [{ type: String }],
                    none : [{ type: String }]
                };
            }
        }

        if (api.unsafe && api.unsafe.security) {
            schema.security.unsafe = {
                restricted : {type : Boolean, default : true},
                one : [{ type: String }],
                all : [{ type: String }],
                none : [{ type: String }]
            };
        }

        for(var prop in api.unsafe) {
            if (api.unsafe[prop].security) {
                schema.security['unsafe.' + prop] = {
                    restricted : {type : Boolean, default : true},
                    one : [{ type: String }],
                    all : [{ type: String }],
                    none : [{ type: String }]
                };
            }
        }

        // add custom shema to the model
        for(var param in api.state.independent) {
            schema[param] = api.state.independent[param];
        }

        for(var param in api.state.dependent) {
            schema[param] = api.state.dependent[param];
        }

        var Schema = new mongoose.Schema(schema);

        if (api.state.index) {
            Schema.index(api.state.index);
        }

        // add custom methods to the model
        // these are not exposed in the api, but can be used on database results
        for(var param in api.internal) {
            Schema.methods[param] = api.internal[param];
        }

        Schema.methods.event = function(name, data) {
            server.io.to(model + "_" + this._id).emit(name, data);
        }

        var Model = mongoose.model(model, Schema);

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
            function(req, res, next) {
                try {

                    Model.findById('' + req.params.id)
                        .exec()
                        .then(function(element) {
                            // this will blow up the request if there is not proper permission
                            permission(req.user, element, 'manage');

                            element.edited = Date.now();

                            if (req.body.manage) {
                                element.manage = req.body.manage;
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

        // change the owner
        router.post('/:id/owner',
            bodyParser.json(),
            bodyParser.urlencoded({
                extended: false
            }),
            userAuth(),
            function(req, res, next) {
                try {

                    // make sure the user exists
                    User.findById('' + req.body.user)
                        .exec()
                        .then(function(user) {
                            if (!user) {
                                throw new ModelError('notfound',
                                    'User [0] could not be found to replace the current user.', [req.body.user],
                                    404);
                            }

                            return Model.findById('' + req.params.id).exec()
                        })
                        .then(function(element) {
                            // this will blow up the request if there is not proper permission
                            permission(req.user, element, 'manage');

                            element.edited = Date.now();
                            element.owner = '' + req.body.user;

                            return element.save();
                        })
                        .then(function(element) {
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

        //
        // static methods
        //

        // api
        router.get('/model',
            function(req, res, next) {
                try {
                    res.json(formatModel(api));
                } catch (error) {
                    next(error);
                }
            });

        for(var prop in api.static) {

            (function(method) {
                router.get('/' + prop + (method.route ? method.route : ''),
                    bodyParser.urlencoded({
                        extended: false
                    }),
                    function(req, res, next) {
                        try {
                            method.handler.apply(null, [req, res])
                                .then(function(result){
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
            })(api.static[prop]);

        }

        // add a new resource
        router.post('/',
            bodyParser.json(),
            bodyParser.urlencoded({
                extended: false
            }),
            userAuth(),
            function(req, res, next) {
                try {

                    if (!req.user) {
                        throw new ModelError('nouser',
                            'A user must be logged in to add a [0].', [model],
                            401);
                    }

                    var new_element = new Model();

                    new_element.owner = req.user._id;
                    new_element.created = Date.now();
                    new_element.edited = Date.now();

                    for (var param in api.state.independent) {
                        if (req.body[param]) {
                            new_element[param] = req.body[param];
                        }
                    }

                    var creation_promise;

                    if (api.create) {
                        creation_promise = api.create.apply(new_element, [req]);
                    } else {
                        creation_promise = new_element.save();
                    }

                    creation_promise
                        .then(function(element) {
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

        // full or partial update of the resource state
        if (api.update && api.update.security) {
            router.post('/:id',
                bodyParser.json(),
                bodyParser.urlencoded({
                    extended: false
                }),
                userAuth(),
                function(req, res, next) {
                    try {

                        Model.findById('' + req.params.id)
                            .exec()
                            .then(function(element) {
                                // this will blow up the request if there is not proper permission
                                permission(req.user, element, 'update');

                                element.edited = Date.now();

                                for (var param in api.state.independent) {
                                    if (req.body[param]) {
                                        element[param] = req.body[param];
                                    }
                                }

                                var edit_promise;

                                if (api.update.handler) {
                                    edit_promise = api.update.handler.apply(element, [req]);
                                } else {
                                    edit_promise = element.save();
                                }

                                return edit_promise;
                            })
                            .then(function(element) {
                                // broadcast that the resource has changed to anyone in the channel
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
        } else {
            router.post('/:id',
                bodyParser.json(),
                bodyParser.urlencoded({
                    extended: false
                }),
                function(req, res, next) {
                    try {

                        Model.findById('' + req.params.id)
                            .exec()
                            .then(function(element) {

                                element.edited = Date.now();

                                for (var param in api.state.independent) {
                                    if (req.body[param]) {
                                        element[param] = req.body[param];
                                    }
                                }

                                var edit_promise;

                                if (api.update && api.update.handler) {
                                    edit_promise = api.update.handler.apply(element, [req]);
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
        if (api.get && api.get.security) {
            router.get('/:id',
                bodyParser.json(),
                bodyParser.urlencoded({
                    extended: false
                }),
                userAuth(),
                function(req, res, next) {
                    try {
                        Model.findById('' + req.params.id)
                            .exec()
                            .then(function(element) {
                                if (element.deleted) {
                                    throw new ModelError('notfound',
                                        'This [0] has been peranently removed.',
                                        [model],
                                        410);
                                }

                                if (element.flagged) {
                                    throw new ModelError('notfound',
                                        'This [0] has been flagged for review and is temporarily unavailable.',
                                        [model],
                                        503);
                                }

                                permission(req.user, element, 'get');

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
        } else {
            router.get('/:id',
                bodyParser.urlencoded({
                    extended: false
                }),
                function(req, res, next) {
                    try {
                        Model.findById('' + req.params.id)
                            .exec()
                            .then(function(element) {
                                if (element.deleted) {
                                    throw new ModelError('notfound',
                                        'This [0] has been peranently removed.', [model],
                                        410);
                                }

                                if (element.flagged) {
                                    throw new ModelError('notfound',
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

        for(var prop in api.safe) {
            if (prop === 'security') {
                continue;
            }

            (function(method) {
                // perform a 'get' api call to the resource
                if (api.safe.security || api.safe[prop].security){
                    router.get('/:id/' + prop + (method.route ? method.route : ''),
                        bodyParser.urlencoded({
                            extended: false
                        }),
                        userAuth(),
                        function(req, res, next) {
                            try {
                                Model.findById('' + req.params.id)
                                    .exec()
                                    .then(function(element) {
                                        permission(req.user, element, 'safe');
                                        permission(req.user, element, 'safe.' + prop);
                                        return method.handler.apply(element, [req, res]);
                                    })
                                    .then(function(result){
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
                }else{
                    router.get('/:id/' + prop + (method.route ? method.route : ''),
                        bodyParser.urlencoded({
                            extended: false
                        }),
                        function(req, res, next) {
                            try {
                                Model.findById('' + req.params.id)
                                    .exec()
                                    .then(function(element) {
                                        return method.handler.apply(element, [req, res]);
                                    })
                                    .then(function(result){
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
                }
            })(api.safe[prop]);
        }

        //
        // unsafe methods
        //

        for(var prop in api.unsafe) {
            if (prop === 'security') {
                continue;
            }

            // perform a 'post' api call to the resource
            (function(method) {
                // perform a 'get' api call to the resource
                if (api.unsafe.security || api.unsafe[prop].security){
                    router.post('/:id/' + prop + (method.route ? method.route : ''),
                        bodyParser.urlencoded({
                            extended: false
                        }),
                        userAuth(),
                        function(req, res, next) {
                            try {
                                Model.findById('' + req.params.id)
                                    .exec()
                                    .then(function(element) {
                                        permission(req.user, element, 'unsafe');
                                        permission(req.user, element, 'unsafe.' + prop);
                                        return method.handler.apply(element, [req, res]);
                                    })
                                    .then(function(result){
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
                }else{
                    router.post('/:id/' + prop + (method.route ? method.route : ''),
                        bodyParser.urlencoded({
                            extended: false
                        }),
                        function(req, res, next) {
                            try {
                                Model.findById('' + req.params.id)
                                    .exec()
                                    .then(function(element) {
                                        return method.handler.apply(element, [req, res]);
                                    })
                                    .then(function(result){
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
                }
            })(api.unsafe[prop]);
        }


        server.express.use('/api/' + model, router);

        //
        // Create the necessary route/event handlers for websocket connections
        // to this resource.
        //

        var ioroute = server.io.of('/' + model);

        ioroute.on('connect', function(socket){
            try{
                user_ioAuth(socket);

                // listen for changes to a particular resource.
                socket.on('listen', function(data){
                    Model.findById('' + data._id)
                        .exec()
                        .then(function(element) {
                            permission(socket.user, element, 'get');
                            socket.join(model + "_" + element._id);
                        })
                        .catch(function(error) {
                            socket.emit('error', error);
                        });
                });

                socket.on('leave', function(data){
                    socket.leave(model + "_" + data._id);
                });

            }catch(error) {
                socket.emit('error', error);
            }

        });

    }
};
