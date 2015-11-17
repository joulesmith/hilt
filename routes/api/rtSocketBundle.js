var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');

var Resource = mongoose.model("dacResource");
var SocketBundle = mongoose.model("dacSocketBundle");

var permission = require('permission');

router.use(
    '/',
    function(req, res, next){
        Resource.findOne({
            'name' : 'bundle'
        }, function(err, bundle){
            if (err) {return next(err);}

            if (!bundle) { next(new Error('can\'t find bundle resource')); return; }

            req.bundle_resource = bundle;
            next();
        });
    }
);

// gets a list of all bundles
router.get(
    '/',
    permission.required([{
        name : 'bundle_resource',
        action : 'read'
    }]),
    view_all_devices
);

// create a new bundle
router.post(
    '/',
    permission.required([{
        name : 'bundle_resource',
        action : 'execute'
    }]),
    create_bundle
);

router.param(
    'bundle_id',
    function(req, res, next, id) {

        SocketBundle.findById(
            id,
            function (err, bundle){
                if (err) { next(err); return; }
                if (!bundle) { next(new Error('can\'t find bundle')); return; }

                req.bundle = bundle;
                return next();
            }
        );

    }
);

// update a bundle
router.put(
    '/:bundle_id',
    permission.required([{
        name : 'bundle',
        action : 'write'
    }]),
    update_bundle
);

// get details about a bundle
router.get(
    '/:bundle_id',
    permission.required([{
        name : 'bundle',
        action : 'read'
    }]),
    view_bundle
);

// delete a bundle
router.delete(
    '/:bundle_id',
    permission.required([{
        name : 'bundle',
        action : 'write'
    }]),
    delete_bundle
);
