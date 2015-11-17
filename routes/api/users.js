// load dependencies
var express = require('express');
var router = express.Router();
module.exports = router;
var mongoose = require('mongoose');

// use mongoose database objects
var User = mongoose.model("user");

// creates a new user
router.post('/', function(req, res, next) {
    User.findOne({
        email : '' + req.body.email
    }, function (err, user){
        if (err) {
            return next(err);
        }

        if (user) {
            return res.status(400).json({
                message : 'email already in use.'
            });
        }

        var newuser = new User({
            email : '' + req.body.email
        });

        newuser.setPassword(null, '' + req.body.password, function(err, user){
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
