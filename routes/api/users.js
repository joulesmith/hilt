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
            error : 'password must be supplied'
        });
    }

    if (zxcvbn(req.body.password).score < 3) {
        return res.status(400).json({
            error : 'password is not complex enough'
        });
    }

    User.findOne({
        email : '' + req.body.email
    }, function (err, user){
        if (err) {
            return res.status(500).json({
                error : err
            });
        }

        if (user) {
            return res.status(400).json({
                error : 'email already in use.'
            });
        }

        var newuser = new User({
            email : '' + req.body.email
        });

        newuser.setPassword('' + req.body.password, function(err, user){
            if (err) {
                return next(err);
            }

            res.status(201).json({_id : user._id});
        });


    });
});

// sets a password
router.post('/:email/password', function(req, res, next) {

    if (!req.user || req.user.email !== req.params.email) {
        return res.status(401).json({});
    }

    req.user.setPassword('' + req.body.password, function(err){
        if (err) {
            return next(err);
        }

        res.status(201).json({});
    });

});

// generates a new token
router.post('/:email/token',  function(req, res, next){

    if (!req.user || req.user.email !== req.params.email) {
        return res.status(401).json({});
    }

    req.user.generateToken(function(err, token){
        if (err) {
            return next(err);
        }

        // generate a token, and include information that can be claimed later
        res.json({token: token});
    });
});
