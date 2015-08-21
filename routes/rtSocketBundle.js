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
