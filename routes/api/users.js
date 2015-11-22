// load dependencies
var express = require('express');
var router = express.Router();
module.exports = router;
var mongoose = require('mongoose');

var zxcvbn = require('zxcvbn');

// use mongoose database objects
var User = mongoose.model("user");

var email_regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|museum)\b/;


// creates a new user
router.post('/', function(req, res, next) {


    if (!req.body.email || req.body.email === '') {
        return res.status(400).json({
            error : {
                message : 'email must be supplied'
            }
        });
    }

    if (!email_regex.test(req.body.email)) {
        return res.status(400).json({
            error : {
                message : 'invalid email address'
            }
        });
    }

    if (!req.body.password || req.body.password === '') {
        return res.status(400).json({
            error : {
                message : 'password must be supplied'
            }
        });
    }

    if (zxcvbn(req.body.password).score < 3) {
        return res.status(400).json({
            error : {
                message : 'password is not complex enough'
            }
        });
    }

    var email = '' + req.body.email;
    var password = '' + req.body.password;

    User.findOne({
        email : email
    }, function (err, user){
        if (err) {
            return res.status(500).json({
                error : err
            });
        }

        if (user) {
            return next(new Error('Email address already in use.'));
        }

        var newuser = new User({
            email : email
        });

        newuser.setPassword(password, function(err, user){
            if (err) {
                return next(err);
            }

            user.resetTokens(password, 24*3600*1000, function(err, user){
                if (err) {
                    return next(err);
                }

                res.status(201).json({_id : user._id});
            });

        });


    });
});

// sets a password
router.post('/:email/password', function(req, res, next) {

    if (!req.user || req.user.email !== req.params.email) {
        return res.status(401).json({});
    }

    var password  = '' + req.body.password;

    req.user.setPassword(password, function(err, user){
        if (err) {
            return next(err);
        }

        res.status(201).json({});
    });

});

// generates a new token
router.post('/token',  function(req, res, next){

    if (!req.user || !req.body.password) {
        return res.status(401).json({
            error : {
                message : 'The email and password combination provided are not valid.'
            }
        });
    }

    req.user.generateToken('' + req.body.password, function(err, token){
        if (err) {
            return next(err);
        }

        // generate a token, and include information that can be claimed later
        res.json({token: token});
    });
});

router.post('/token/reset',  function(req, res, next){

    if (!req.user || !req.body.password) {
        return res.status(401).json({
            error : {
                message : 'Token reset is not authorized.'
            }
        });
    }

    req.user.resetTokens('' + req.body.password, 24*3600*1000, function(err, user){
        if (err) {
            return next(err);
        }

        res.status(201).json({_id : user._id});
    });
});
