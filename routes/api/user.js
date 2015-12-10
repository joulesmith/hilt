// load dependencies
var express = require('express');
var router = express.Router();
module.exports = router;
var mongoose = require('mongoose');
var userAuth = require('../../middleware/user');
var _ = require('lodash');
var Promise = require('bluebird');

var UsersError = require('../../error')('routes.api.users');

var zxcvbn = require('zxcvbn');
var bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

// use mongoose database objects
var User = mongoose.model("user");

var email_regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|museum)\b/;


// creates a new user
router.post('/', function(req, res, next) {
    try {

        if (!req.body.email || req.body.email === '') {
            throw new UsersError('noemail',
                'An email address must be supplied to register a new user.',
                [],
                400);
        }

        if (!email_regex.test(req.body.email)) {
            throw new UsersError('invalidemail',
                'The email address {0} is not recognized as a valid address.',
                [req.body.email],
                400);
        }

        if (!req.body.password || req.body.password === '') {
            throw new UsersError('nopassword',
                'A password must be supplied to register a new user.',
                [],
                400);
        }

        var password_result = zxcvbn(req.body.password);

        if (password_result.score < 3) {
            throw new UsersError('insecurepassword',
                'The password supplied scored {0}/4 for security. A minimum of 3/4 is required.',
                [password_result.score],
                400);
        }

        var email = '' + req.body.email;
        var password = '' + req.body.password;

        User.findOne({email : email})
        .then(function(user){
            if (user) {
                throw new UsersError('emailinuse',
                    'The email address {0} is already in use by another user.',
                    [email],
                    400);
            }
        })
        .then(function(){
            var newuser = new User({
                email : email
            });

            return newuser.setPassword(password);
        })
        .then(function(user){
            if (!user) {
                throw new UsersError('internal',
                    'An error has occured while setting the password.',
                    [],
                    500);
            }

            return user;
        })
        .then(function(user){
            return res.status(201).json({_id : user._id});
        }, function(error){
            next(error);
        });

    }catch(error) {
        next(error);
    }
});


// creates a new guest user
router.post('/guest', function(req, res, next) {
    try {

        var new_user = new User();

        new_user.generateGuestToken()
        .then(function(token){
            res.json({token: token});
        })
        .catch(function(error){
            next(error);
        });

    }catch(error) {
        next(error);
    }
});

router.post('/merge', userAuth(), function(req, res, next) {
    try {
        var fromUser = null;
        var toUser = null;

        User.findById(req.body.fromToken._id).exec()
        .then(function(user){
            if (!user) {
                throw new UsersError('nouser',
                    'From user not found.',
                    [],
                    404);
            }

            if (user.passwordHash !== '') {
                throw new UsersError('notguest',
                    'Only a guest account may be merged with another account.',
                    [],
                    403);
            }

            return user.verifyToken(req.body.fromToken);
        }).then(function(user){
            fromUser = user;
            return User.findById(req.body.toToken._id).exec()
        })
        .then(function(user){
            if (!user) {
                throw new UsersError('nouser',
                    'To user not found.',
                    [],
                    404);
            }

            return user.verifyToken(req.body.toToken);
        }).then(function(user){
            toUser = user;

            if (!fromUser || !toUser) {
                throw new UsersError('unauthorized',
                    'Merge failed because it is not authorized.',
                    [],
                    401);
            }

            // merge by changing all ownerships and/or references?
            //
            if (fromUser.accessRecords) {

                var promises = [];

                if (!toUser.accessRecords) {
                    toUser.accessRecords = {
                        records : [],
                        actions: []
                    };
                }

                fromUser.accessRecords.records.forEach(function(record, fromIndex) {
                    // add the record to the to user
                    var toIndex = _.sortedIndex(toUser.accessRecords.records, record);
                    toUser.accessRecords.records.splice(toIndex, 0, record);
                    toUser.accessRecords.actions.splice(toIndex, 0, fromUser.accessRecords.actions[fromIndex]);

                    // change the record
                    var part = record.split('/');

                    promises.push(mongoose.model(part[0]).findById(part[1]).exec()
                    .then(function(element){

                        for(var action in fromUser.accessRecords.actions[fromIndex]) {
                            if (fromUser.accessRecords.actions[fromIndex][action]) {
                                var security = element.security[action];
                                security.users.splice(_.indexOf(security.users, '' + fromUser._id, true), 1)
                                security.users.splice(_.sortedIndex(security.users, '' + toUser._id), 0, '' + toUser._id);
                            }
                        }

                        element.markModified('security');
                        return element.save();
                    }));
                });


                return Promise.all(promises)
                .then(function(element){
                    toUser.markModified('accessRecords');
                    return toUser.save();
                })
                .then(function(toUser){
                    return fromUser.remove();
                })
            }else{
                return fromUser.remove();
            }
        })
        .then(function(){
            res.json({});
        })
        .catch(function(error){
            next(error);
        });
    }catch(error) {
        next(error);
    }
});

// sets a password
router.post('/password', userAuth(), function(req, res, next) {
    try{
        if (!req.user) {

            throw new UsersError('nouser',
                'A user must be logged in to change their password.',
                [],
                401);
        }

        var old_password  = '' + req.body.old_password;
        var password  = '' + req.body.password;

        req.user.setPassword(password)
        .then(function(user){
            res.status(201).json({});
        }, function(error){
            next(error);
        });
    }catch(error){
        next(error);
    }
});

// generates a new token
router.post('/token', userAuth(),  function(req, res, next){

    try{
        if (!req.user || !req.body.password) {

            throw new UsersError('nouser',
                'The email and password combination provided are not valid.',
                [],
                401);
        }



        req.user.generateToken('' + req.body.password)
        .then(function(token){
            res.json({token: token});
        })
        .catch(function(error){
            next(error);
        }).done();
    }catch(error){
        next(error);
    }
});

// invalidates all tokens.
router.post('/token/reset', userAuth(),  function(req, res, next){
    try{
        if (!req.user || !req.body.password) {
            throw new UsersError('nouser',
                'The email and password combination provided are not valid.',
                [],
                401);
        }

        req.user.resetTokens('' + req.body.password)
        .then(function(user){
            res.status(201).json({_id : user._id});
        }, function(error){
            next(error);
        });
    }catch(error){
        next(error);
    }
});
