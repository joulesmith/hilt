// load dependencies
var express = require('express');
var router = express.Router();
module.exports = router;
var mongoose = require('mongoose');
var userAuth = require('../../middleware/user');

var ProfileError = require('../../error')('routes.api.profile');

// use mongoose database objects
var Profile = mongoose.model("profile");

var prepare = function(content) {
    return content;
};

// creates a new profile
router.post('/', userAuth(), function(req, res, next) {
    try{
        if (!req.user) {
            throw new ProfileError('nouser',
                'A user must be logged in to create a profile.',
                [],
                401);
        }

        var new_profile = new Profile({
            user : req.user._id,
            name : '' + req.body.name,
            rows : []
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
            throw new ProfileError('nouser',
                'A user must be logged in to edit a profile.',
                [],
                401);
        }

        Profile.findById('' + req.params.profile_id)
        .exec()
        .then(function(profile){
            if (profile.user !== req.user._id) {
                throw new ProfileError('unauthorized',
                    'A user can only edit their own profiles.',
                    [],
                    401);
            }

            // update profile information
            profile.name = '' + req.body.name,
            profile.data = prepare(req.body.data);

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

// searches profiles and returns matches
router.get('/', function(req, res, next) {
    try {
        Profile.find(
            { $text : { $search : '' + req.query.words } },
            { score : { $meta: "textScore" } }
        )
        .sort({ score : { $meta : 'textScore' } })
        .exec()
        .then(function(profiles){
            if (!profiles) {
                throw new ProfileError('noresults',
                    'No profiles found matching search words.',
                    [],
                    404);
            }

            res.json(profiles);
        })
        .catch(function(error){
            next(error);
        });
    }catch(error){
        next(error);
    }
});

// gets a specific profile
router.get('/:profile_id', function(req, res, next) {
    try {
        Profile.findById('' + req.params.profile_id)
        .exec()
        .then(function(profile){
            if (!profile) {
                throw new ProfileError('notfound',
                    'The profile could not be found.',
                    [],
                    404);
            }

            res.json(profile);
        })
        .catch(function(error){
            next(error);
        });
    }catch(error){
        next(error);
    }
});
