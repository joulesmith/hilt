// load dependencies
var express = require('express');
var router = express.Router();
module.exports = router;
var mongoose = require('mongoose');
var userAuth = require('../../middleware/user');

var ProfilesError = require('../../error')('routes.api.profiles');

// use mongoose database objects
var Profile = mongoose.model("profile");

var prepare = function(content) {
    return content;
};

// creates a new profile
router.post('/', userAuth(), function(req, res, next) {
    try{
        if (!req.user) {
            throw new ProfilesError('nouser',
                'A user must be logged in to create a profile.',
                [],
                401);
        }

        var new_profile = new Profile({
            user : req.user._id,
            name : '' + req.body.name,
            sections : []
        });

        new_profile.save()
        .then(function(profile){
            res.json(profile);
        }).catch(function(error){
            next(error);
        });
    }catch(error){
        next(error);
    }
});

// edit
router.post('/:profile_id', userAuth(), function(req, res, next) {
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
            res.json(profile);
        }).catch(function(error){
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
        })
        .catch(function(error){
            next(error);
        });
    }catch(error){
        next(error);
    }
});
