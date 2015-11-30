/**
 *
 * Factory for producing REST and mongoose models for general resources.
 *
 */
var express = require('express');
var mongoose = require('mongoose');
var userAuth = require('../middleware/user');
var error = require('../error');
var _ = require('lodash');

var User = mongoose.model('user');
var bodyParser = require('body-parser');


module.exports = function(spec) {

    var ModelError = error('routes.api.' + spec.name);

    var permission = function(user, resource, action) {
        var i;

        if (!spec.authenticate[action] || !resource[action].restricted) {
            return null;
        }

        if (!user) {
            throw new ModelError('nouser',
                'A user must be logged in to [0] this [1].',
                [action, spec.name],
                401);
        }

        if (user === resource.owner) {
            return;
        }

        var one = resource[action].one;
        var all = resource[action].all;
        var none = resource[action].none;

        // user needs at least one of these attributes
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

        // a user must have all of these attributes
        for(i = 0; i < all.length; i++) {
            if (_.indexOf(user.attributes, all[i], true) === -1) {
                throw new ModelError('unauthorized',
                    'The user does not possess all of the required attributes.',
                    [],
                    403);
            }
        }

        // a user must not have any of these attributes
        for(i = 0; i < none.length; i++) {
            if (_.indexOf(user.attributes, none[i], true) !== -1) {
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
        owner : { type: mongoose.Schema.Types.ObjectId, ref: 'user', index : true},
        // time created in unix time [milliseconds]
        created : {type : Number, default: 0},
        // time last edited in unix time [milliseconds]
        edited : {type : Number, default: 0},
        // unavailable until this resource can be reviewed for content
        flagged : {type : Boolean, default : false},
        // no longer can be accessed from public api
        removed : {type : Boolean, default : false}
    };

    // if a user is not the owner they can still interact with the resource
    // these are a list of qualifying, required, and forbidden attributes
    // a user must satisfy to perform the given class of operation

    // able to do anything an owner can do

    schema.manage = {
        restricted : {type : Boolean, default : true},
        one : [{ type: mongoose.Schema.Types.ObjectId, ref: 'attribute' }],
        all : [{ type: mongoose.Schema.Types.ObjectId, ref: 'attribute' }],
        none : [{ type: mongoose.Schema.Types.ObjectId, ref: 'attribute' }]
    };


    // can change something about the resource
    if (spec.authenticate.write) {
        schema.write = {
            restricted : {type : Boolean, default : true},
            one : [{ type: mongoose.Schema.Types.ObjectId, ref: 'attribute' }],
            all : [{ type: mongoose.Schema.Types.ObjectId, ref: 'attribute' }],
            none : [{ type: mongoose.Schema.Types.ObjectId, ref: 'attribute' }]
        };
    }

    // can access information about this resource, but cannot alter it in any way
    if (spec.authenticate.read) {
        schema.read = {
            restricted : {type : Boolean, default : true},
            one : [{ type: mongoose.Schema.Types.ObjectId, ref: 'attribute' }],
            all : [{ type: mongoose.Schema.Types.ObjectId, ref: 'attribute' }],
            none : [{ type: mongoose.Schema.Types.ObjectId, ref: 'attribute' }]
        };
    }

    // can call rest api functions of this resource, but not the underlying data
    // unless that data is returned by an api call
    if (spec.authenticate.execute) {
        schema.execute = {
            restricted : {type : Boolean, default : true},
            one : [{ type: mongoose.Schema.Types.ObjectId, ref: 'attribute' }],
            all : [{ type: mongoose.Schema.Types.ObjectId, ref: 'attribute' }],
            none : [{ type: mongoose.Schema.Types.ObjectId, ref: 'attribute' }]
        };
    }

    // add custom shema to the model
    for(var param in spec.api.state) {
        schema[param] = spec.api.state[param];
    }

    var Schema = new mongoose.Schema(schema);

    // add custom methods to the model
    // these are not exposed in the api, but can be used on database results
    for(var param in spec.internal.methods) {
        Schema.methods[param] = spec.internal.methods[param];
    }

    if (spec.internal.index) {
        Schema.index(spec.internal.index);
    }

    var Model = mongoose.model(spec.name, Schema);

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

                        if (req.body.write) {
                            element.write = req.body.write;
                        }

                        if (req.body.read) {
                            element.read = req.body.read;
                        }

                        if (req.body.execute) {
                            element.execute = req.body.execute;
                        }

                        return element.save();
                    })
                    .then(function(element) {
                        var response = {};

                        response[spec.name] = [element];

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

                        response[spec.name] = element;

                        res.json(response);
                    })
                    .catch(function(error) {
                        next(error);
                    });
            } catch (error) {
                next(error);
            }
        });

    // add a new resource
    router.post('/',
        bodyParser.json(),
        bodyParser.urlencoded({
            extended: false
        }),
        userAuth(),
        function(req, res, next) {
            try {
                console.log(req.user);
                if (!req.user) {
                    throw new ModelError('nouser',
                        'A user must be logged in to add a [0].', [spec.name],
                        401);
                }

                var new_element = new Model();

                new_element.owner = req.user._id;
                new_element.created = Date.now();
                new_element.edited = Date.now();

                for (var param in spec.api.state) {
                    if (req.body[param]) {
                        new_element[param] = req.body[param];
                    }
                }

                var creation_promise;

                if (spec.api.create) {
                    creation_promise = spec.api.create.apply(new_element, [req]);
                } else {
                    creation_promise = new_element.save();
                }

                creation_promise
                    .then(function(element) {
                        var response = {};

                        response[spec.name] = [element];

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
    if (spec.authenticate.write) {
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
                            permission(req.user, element, 'write');

                            element.edited = Date.now();

                            for (var param in spec.api.state) {
                                if (req.body[param]) {
                                    element[param] = req.body[param];
                                }
                            }

                            var edit_promise;

                            if (spec.api.update) {
                                edit_promise = spec.api.update.apply(element, [req]);
                            } else {
                                edit_promise = element.save();
                            }

                            return edit_promise;
                        })
                        .then(function(element) {
                            var response = {};

                            response[spec.name] = [element];

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

                            for (var param in spec.api.state) {
                                if (req.body[param]) {
                                    element[param] = req.body[param];
                                }
                            }

                            var edit_promise;

                            if (spec.internal.editMethod) {
                                edit_promise = spec.internal.editMethod.apply(element, [req]);
                            } else {
                                edit_promise = element.save();
                            }

                            return edit_promise;
                        })
                        .then(function(element) {
                            var response = {};

                            response[spec.name] = [element];

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
    if (spec.authenticate.read) {
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
                                    'This [0] has been peranently removed.', [spec.name],
                                    410);
                            }

                            if (element.flagged) {
                                throw new ModelError('notfound',
                                    'This [0] has been flagged for review and is temporarily unavailable.', [spec.name],
                                    503);
                            }

                            permission(req.user, element, 'read');

                            if (spec.internal.accessMethod) {
                                spec.internal.accessMethod.apply(element, [req]);
                            }

                            var response = {};
                            response[spec.name] = [element];

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
                                    'This [0] has been peranently removed.', [spec.name],
                                    410);
                            }

                            if (element.flagged) {
                                throw new ModelError('notfound',
                                    'This [0] has been flagged for review and is temporarily unavailable.', [spec.name],
                                    503);
                            }

                            var response = {};
                            response[spec.name] = [element];

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
    // static methods
    //

    for(var param in spec.api.static) {

        router.get('/' + param,
            bodyParser.urlencoded({
                extended: false
            }),
            function(req, res, next) {
                try {
                    Model.findById('' + req.params.id)
                        .exec()
                        .then(function(element) {

                            return spec.api.static[param].apply(element, [req, res]);
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

    for(var param in spec.api.safe) {
        // perform a 'get' api call to the resource
        if (spec.authenticate.execute){
            router.get('/:id/' + param,
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
                                permission(req.user, element, 'execute');
                                return spec.api.safe[param].apply(element, [req, res]);
                            })
                            .catch(function(error) {
                                next(error);
                            });
                    } catch (error) {
                        next(error);
                    }
                });
        }else{
            router.get('/:id/' + param,
                bodyParser.urlencoded({
                    extended: false
                }),
                function(req, res, next) {
                    try {
                        Model.findById('' + req.params.id)
                            .exec()
                            .then(function(element) {
                                return spec.api.safe[param].apply(element, [req, res]);
                            })
                            .catch(function(error) {
                                next(error);
                            });
                    } catch (error) {
                        next(error);
                    }
                });
        }
    }

    //
    // unsafe methods
    //

    for(var param in spec.api.unsafe) {
        // perform a 'post' api call to the resource
        if (spec.authenticate.execute || spec.authenticate.write){
            router.post('/:id/' + param,
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
                                permission(req.user, element, 'execute');
                                permission(req.user, element, 'write');
                                return spec.api.unsafe[param].apply(element, [req, res]);
                            })
                            .catch(function(error) {
                                next(error);
                            });
                    } catch (error) {
                        next(error);
                    }
                });
        }else{
            router.post('/:id/' + param,
                bodyParser.json(),
                bodyParser.urlencoded({
                    extended: false
                }),
                function(req, res, next) {
                    try {
                        Model.findById('' + req.params.id)
                            .exec()
                            .then(function(element) {
                                return spec.api.unsafe[param].apply(element, [req, res]);
                            })
                            .catch(function(error) {
                                next(error);
                            });
                    } catch (error) {
                        next(error);
                    }
                });
        }
    }

    spec.app.use('/api/' + spec.name, router);
};
