// load dependencies
var express = require('express');
var router = express.Router();
module.exports = router;
var mongoose = require('mongoose');
var ProfilesError = require('../../error')('routes.api.profiles');

// use mongoose database objects
var Profile = mongoose.model("profile");

var prepare = function(content) {
    return content;
};

// creates a new profile
router.post('/', function(req, res, next) {
    try{
        if (!req.user) {
            throw new ProfilesError('nouser',
                'A user must be logged in to create a profile.',
                [],
                401);
        }

        Profile.create({
            user : req.user,
            name : '' + req.body.name
        })
        .save()
        .then(function(profile){
            res.json({});
        }, function(error){
            next(error);
        });
    }catch(error){
        next(error);
    }
});

// edit
router.post('/:profile_id', function(req, res, next) {
    try{
        if (!req.user) {
            throw new ProfilesError('nouser',
                'A user must be logged in to create a profile.',
                [],
                401);
        }

        Profile.findById('' + req.params.profile_id)
        .exec()
        .then(function(profile){
            if (profile.user !== req.user) {
                throw new ProfilesError('unauthorized',
                    'A user can only edit their own profiles.',
                    [],
                    401);
            }

            // update profile information
            profile.name = '' + req.body.name,
            profile.content = prepare(req.body.content);

            return profile.save();
        })
        .then(function(profile){
            res.json({});
        }, function(error){
            next(error);
        });
    }catch(error){
        next(error);
    }
});

router.get('/:profile_id', function(req, res, next) {
    try {
        Profile.findById('' + req.params.profile_id)
            .exec()
            .then(function(profile){
                res.json(profile);
            }, function(error){
                next(error);
            });
    }catch(error){
        next(error);
    }
});
