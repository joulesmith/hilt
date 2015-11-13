/*
    Copyright (C) 2015  Joulesmith Energy Technologies, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// load dependencies
var express = require('express');
var router = express.Router();
module.exports = router;


var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('jsonwebtoken');

// use mongoose database objects
var JWTSecret = mongoose.model("broadsword_jwtSecret");
var Permission = mongoose.model("broadsword_permission");
var Resource = mongoose.model("broadsword_resource");
var User = mongoose.model("broadsword_user");

// this will hold the secret to use when generating and verifying tokens.
var secret = "";


var register = function(req, res, next) {
    User.findOne({
        username : req.param('username')
    }, function (err, user){
        if (err) { next(err); return; }

        // this username already exists
        if (user) { return res.redirect('/login'); }

        var newuser = new User({
            username : req.params.username,
            email : req.query.email
        });

        newuser.resetSalt();

        var secret = newuser.generateReset();

        // todo: send the secret through a trusted channel to the user.

        newuser.save(function (err) {
            if (err) return next(err);

            next();
        });

    });
};

var get_salt = function(req, res, next) {
    res.json({
        salt : req.user.public_salt
    });
};

var set_password = function(req, res, next) {

    User.findOne({
        username : req.params.username
    }, function (err, user){
        if (err) { next(err); return; }

        if (!user) { return res.redirect('/register'); }


        // they need to know the secret to set the password
        if (!user.verifyReset(req.params.secret)) {
            return res.redirect('/login');
        }

        user.setPassword(req.params.password);

        user.save(function (err) {
            if (err) return next(err);

            next();
        });
    });


};

// authenticate a user logging in
var login = function(req, res, next){

    if (secret === "") {
        return res.status(400).json({message: 'Authentication cannot be performed at this time.'});
    }

    User.findOne({
        username : req.params.username
    }, function (err, user){
        if (err) { next(err); return; }

        if (!user) { return res.redirect('/register'); }


        if (!user.verifyPassword(req.params.password)) {
            return res.redirect('/login');
        }

        // set expiration to 60 days
        var exp = new Date();

        exp.setDate(exp.getDate() + 60);

        // this information is what the generated token can vouche for.
        var claim = {
            _id: user._id,
            expiration: parseInt(exp.getTime() / 1000),
        };

        // generate a token, and include information that can be claimed later
        return res.json({token: jwt.sign(claim, secret)});
    });
};

// register a new user
router.post(
    '/:username',
    register
);

// get the public salt used to send the password
router.get(
    '/salt/:username',
    get_salt
);

// set the password for the user
router.put(
    '/:username/:secret/:password',
    set_password
);

// login by sending the hash of the salt and password
router.get(
    'token/:username/:password',
    login
);


// pull secret from the database
router.update_secret = function() {
    JWTSecret.findOne({}, function(err, doc){
        if (err) {
            // try again later?
        }else{
            secret = doc.secret;
        }
    });
};

// veryify a user's token and any permissions needed to view a particular resource
// a resource is queried first to see if a user even needs to be logged in to view it.
// supply a list of pairs {name: 'object name on the req object', action: 'either read, write, or execute'}
router.get_permission = function(input) {

    return function(req, res, next) {

        // if the object has permission fields it can let anyone do these things to the
        // resource.

        var allowed = true;
        var required_resources = [];
        var required_actions = [];

        for(var i = 0; i < input.length; i++){

            var permission = input[i];

            var resource = req[permission.name];

            if (!resource) {
                return res.status(400).json({message: 'There is no resource to gain permission to.'});
            }

            if (!resource[permission.action]){
                // the resource is restricted, so need to check if user has permission
                allowed = false;
                required_resources.push(resource._id);
                required_actions.push(permission.action);
            }
        }

        if (allowed) {
            return next();
        }

        // so either the object itself doesn't grant permission, or the permission
        // field is simply missing from the object. Either way, permission can
        // still be granted by a specific permission object. Howevever, of course
        // before we can do that we have to verify that the person claiming to be
        // logged in is the real one.
        if (secret === "") {
            // if we don't have a secret we can't verify anything.
            return res.redirect('/login');
        }

        // ok, we have the secret, so I know we can verify the token, and thus
        // verify the claimed user id.

        // extract the token from the request object
        var token;
        if (req.headers && req.headers.authorization) {

            var parts = req.headers.authorization.split(' ');

            if (parts.length == 2) {

                var scheme = parts[0];

                if (/^Bearer$/i.test(scheme)) {
                    token = parts[1];
                } else {
                    return res.redirect('/login');
                }
            } else {
                return res.redirect('/login');
            }
        }else{
            return res.redirect('/login');
        }

        // verify token based on secret
        jwt.verify(token, secret, function(err, decoded) {

            // check the date to see if the token is exprired.
            if (err || parseInt(Date.now() / 1000) > decoded.expiration) {
                return res.redirect('/login');
            }

            // if the user is still logged in, look them up.
            User.findById(decoded._id, function(err, user){
                if (err) return next(err);

                // add the user object to the request object
                req.user = user;

                // now that the user is verified, we need to check they have all
                // of the permissions

                function verify_remaining_resources() {

                    var resource = required_resources.pop();
                    var action = required_actions.pop();

                    Permission.find({
                        'user': user._id,
                        'resource' : resource,
                        action : true
                    }, function(err, permission){
                        if (err) { next(err); return;}

                        if (permission) {

                            if (required_resources.length === 0) {
                                // everything has been verified
                                next(); return;
                            }

                            verify_remaining_resources();
                            return;
                        }

                        res.status(403).json({message: 'You do not have permission to do this.'});
                    });
                }

                verify_remaining_resources();

            });
        });


    };
};

// verifies token to be used with socket.io connection
// calls callback with user id if ok.
router.io_verify = function(token, callback) {

    if (secret === "") {
        // if we don't have a secret we can't verify anything.
        return callback();
    }

    // verify token based on secret
    jwt.verify(token, secret, function(err, decoded) {

        // check the date to see if the token is exprired.
        if (err || parseInt(Date.now() / 1000) > decoded.expiration) {
            return callback();
        }

        callback(decoded._id)

    });
}
