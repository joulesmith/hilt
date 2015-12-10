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

// Returns true on the first occurence of a commone element between two
// sorted arrays. False if there are no common elements
var hasCommonElement = function(sortedArray1, sortedArray2) {
    var i, j;

    i = 0;
    j = 0;

    while(i < sortedArray1.length && j < sortedArray2.length) {
        if (sortedArray1[i] === sortedArray2[j]) {
            return true;
        }else if (sortedArray1[i] < sortedArray2[j]) {
            i++;
        }else{
            j++;
        }
    }

    return false;
};

module.exports = function(server, models) {
    // creates a pure json formatted string represenation of this model
    var formatModel = function(api) {

    };

    for(var model in models) {

        var api = models[model];

        var ModelError = error('routes.api.' + model);

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
            security : {type: mongoose.Schema.Types.Mixed, default: {manage: {}}}
        };

        // if a user is not the owner they can still interact with the resource
        // these are a list of qualifying, required, and forbidden attributes
        // a user must satisfy to perform the given class of operation
        //
        var secure = {
        };

        // can change something about the resource
        if (api.update && api.update.security) {
            secure.update = true;
        }

        // can access information about this resource, but cannot alter it in any way
        if (api.get && api.get.security) {
            secure.get = true;
        }

        if (api.safe && api.safe.security) {
            secure.safe = true;
        }

        // add method specific security
        for(var prop in api.safe) {
            if (api.safe[prop].security) {
                if (secure.safe) {
                    throw new Error('Security cannot be applied at two different levels.');
                }

                secure['safe.' + prop] = true;
            }
        }

        if (api.unsafe && api.unsafe.security) {
            secure.unsafe = true;
        }

        for(var prop in api.unsafe) {
            if (api.unsafe[prop].security) {
                if (secure.unsafe) {
                    throw new Error('Security cannot be applied at two different levels.');
                }

                secure['unsafe.' + prop] = true;
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
                if (user.groups && security.groups && hasCommonElement(user.groups, security.groups)){
                    return true;
                }
            }

            if (action === 'root') {
                return false;
            }else{
                // as a last resort, any user able to be root can do also anything else
                return this.testAccess('root', user);
            }

        };

        Schema.methods.grantUserAccess = function(actions, user) {
            var element = this;
            var user_id = '' + user._id;

            if (!user.accessRecords) {
                user.accessRecords = {
                    records : [],
                    actions: []
                };
            }

            var record = model + '/' + element._id;

            var recordIndex = _.sortedIndex(user.accessRecords.records, record);

            if (user.accessRecords.records[recordIndex] !== record) {
                user.accessRecords.records.splice(recordIndex, 0, record);
                user.accessRecords.actions.splice(recordIndex, 0, {});
            }

            actions.forEach(function(action){
                var security = element.security[action] || (element.security[action] = {});
                user.accessRecords.actions[recordIndex][action] = true;

                if (!security.users) {
                    security.users = [];
                }

                var index = _.sortedIndex(security.users, user_id);

                if (security.users[index] !== user_id) {
                    security.users.splice(index, 0, user_id);
                }

            });

            this.markModified('security');
            user.markModified('accessRecords');

            return user.save().return(this.save());
        };

        Schema.methods.revokeUserAccess = function(actions, user) {
            var element = this;
            var user_id = '' + user._id;

            var record = model + '/' + element._id;
            var recordIndex = _.indexOf(user.accessRecords.records, record, true);

            actions.forEach(function(action){
                var security = element.security[action];
                user.accessRecords.actions[recordIndex][action] = false;

                var index = _.indexOf(security.users, user_id, true);

                if (index !== -1) {
                    security.users.splice(index, 1);
                }
            });

            this.markModified('security');
            user.markModified('accessRecords');

            return user.save().return(this.save());
        };

        Schema.methods.grantGroupAccess = function(actions, group_id) {
            var resource = this;

            actions.forEach(function(action){
                var security = resource.security[action] || (resource.security[action] = {});

                if (!security.groups) {
                    security.groups = [];
                }

                var index = _.sortedIndex(security.groups, group_id);

                if (security.groups[index] !== group_id) {
                    security.groups.splice(index, 0, group_id);
                }
            });

            this.markModified('security');

            return this.save();
        };

        Schema.methods.revokeGroupAccess = function(actions, group_id) {
            var resource = this;

            actions.forEach(function(action){
                var security = resource.security[action];

                var index = _.indexOf(security.groups, group_id);

                if (index !== -1) {
                    security.groups.splice(index, 1);
                }
            });

            this.markModified('security');
            return this.save();
        };

        var Model = mongoose.model(model, Schema);

        //
        // Make a pure json format string of Model
        //
        var jsonModel = {
            state : {
                independent : {},
                dependent : {}
            },
            static : {},
            safe : {},
            unsafe : {},
            secure : secure
        };

        for(var prop in api.static) {
            jsonModel.static[prop] = {};
        }

        for(var prop in api.safe) {
            jsonModel.safe[prop] = {};
        }

        for(var prop in api.unsafe) {
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
            function(req, res, next) {
                try {

                    Model.findById('' + req.params.id)
                        .exec()
                        .then(function(element) {
                            // this will blow up the request if there is not proper permission
                            if (!element.testAccess('root', req.user)){
                                throw new ModelError('noaccess',
                                    'User does not have permission to alter the permissions of this [1].',
                                    ['root', model],
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

                    new_element.created = Date.now();
                    new_element.edited = Date.now();

                    for (var param in api.state.independent) {
                        if (req.body[param]) {
                            new_element[param] = req.body[param];
                        }
                    }

                    // TODO: assign default root user/group (if any) based on model definition
                    new_element.grantUserAccess(['root'], req.user)
                        .then(function(element){
                            if (api.create) {
                                return api.create.apply(new_element, [req]);
                            }else{
                                return element;
                            }
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

        // full or partial update of the resource state
        if (secure['update']) {
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
                                if (!element.testAccess('update', req.user)){
                                    throw new ModelError('noaccess',
                                        'User does not have permission to [0] this [1].',
                                        ['update', model],
                                        403);
                                }

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
        if (secure['get']) {
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

                                if (!element.testAccess('get', req.user)){
                                    throw new ModelError('noaccess',
                                        'User does not have permission to [0] this [1].',
                                        ['get', model],
                                        403);
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

            (function(prop, method) {
                // perform a 'get' api call to the resource
                if (secure['safe']){
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

                                        if (!element.testAccess('safe', req.user)){
                                            throw new ModelError('noaccess',
                                                'User does not have permission to [0] this [1].',
                                                ['safe.' + prop, model],
                                                403);
                                        }

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
                }else if (secure['safe.' + prop]){
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

                                        if (!element.testAccess('safe.' + prop, req.user)){
                                            throw new ModelError('noaccess',
                                                'User does not have permission to [0] this [1].',
                                                ['safe.' + prop, model],
                                                403);
                                        }

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
            })(prop, api.safe[prop]);
        }

        //
        // unsafe methods
        //

        for(var prop in api.unsafe) {
            if (prop === 'security') {
                continue;
            }

            // perform a 'post' api call to the resource
            (function(prop, method) {
                // perform a 'get' api call to the resource
                if (secure['unsafe']){
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
                                        if (!element.testAccess('unsafe', req.user)){
                                            throw new ModelError('noaccess',
                                                'User does not have permission to [0] this [1].',
                                                ['unsafe.' + prop, model],
                                                403);
                                        }

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
                }else if(secure['unsafe.' + prop]){
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

                                        if (!element.testAccess('unsafe.' + prop, req.user)){
                                            throw new ModelError('noaccess',
                                                'User does not have permission to [0] this [1].',
                                                ['unsafe.' + prop, model],
                                                403);
                                        }

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
            })(prop, api.unsafe[prop]);
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
                            if (!element.testAccess('get', req.user)){
                                throw new ModelError('noaccess',
                                    'User does not have permission to [0] this [1].',
                                    ['get', model],
                                    403);
                            }

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
