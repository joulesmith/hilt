// load dependencies
var express = require('express');
var router = express.Router();
module.exports = router;
var mongoose = require('mongoose');
var userAuth = require('../../middleware/user');

var ExampleError = require('../../error')('routes.api.example');

// use mongoose database objects
var Example = mongoose.model("example");


// setter
router.post('/:id', userAuth(), function(req, res, next) {
    try{
        if (!req.user) {
            throw new ExampleError('nouser',
                'A user must be logged in to set this example.',
                [],
                401);
        }

        Example.findById('' + req.params.id)
        .exec()
        .then(function(example){
            if (example.user !== req.user) {
                throw new ExampleError('unauthorized',
                    'A user can only set their own examples.',
                    [],
                    401);
            }

            // update example information
            example.content = req.body.content;

            return example.save();
        })
        .then(function(example){
            res.json(example);
        })
        .catch(function(error){
            next(error);
        });
    }catch(error){
        next(error);
    }
});

// getter
router.get('/:id', function(req, res, next) {
    try {
        Example.findById('' + req.params.id)
        .exec()
        .then(function(example){
            res.json(example);
        })
        .catch(function(error){
            next(error);
        });
    }catch(error){
        next(error);
    }
});
