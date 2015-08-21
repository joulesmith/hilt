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


var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('jsonwebtoken');

var JWTSecret = mongoose.model("dacJWTSecret");
var Permission = mongoose.model("dacPermission");
var Resource = mongoose.model("dacResource");

var User = mongoose.model("dacUser");

// this will hold the secret to use when generating and verifying tokens.
var secret = "";

// pull secret from the database
exports.update_secret = function() {
    JWTSecret.findOne({}, function(err, doc){
        if (err) {
            // try again later?
        }else{
            secret = doc.secret;
        }
    });
};

// authenticate a user logging in
exports.express.authenticate = function(input) {

    return function(req, res, next){

        if (secret === "") {
            return res.status(400).json({message: 'Authentication cannot be performed at this time.'});
        }

        if(!req.body.username || !req.body.password){
            return res.status(400).json({message: 'Please fill out all fields'});
        }

        passport.authenticate('local', function(err, user, info){
            if(err){ return next(err); }

            if(user){
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
            } else {

                // if user is not authenticated, then return the information
                // provided by passport as unauthorized request
                return res.status(401).json(info);
            }
        })(req, res, next);
    };
};

// veryify a user's token and any permissions needed to view a particular resource
// a resource is queried first to see if a user even needs to be logged in to view it.
// supply a list of pairs {name: 'object name on the req object', action: 'either read, write, or execute'}
exports.express.required = function(input) {

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
exports.io.verify = function(token, callback) {

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
