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

var permission = require('permission');

router.use(
    '/',
    function(req, res, next){
        Resource.findOne({
            'name' : 'panel'
        }, function(err, panel){
            if (err) {return next(err);}

            if (!panel) { next(new Error('can\'t find panel resource')); return; }

            req.panel_resource = panel;
            next();
        });
    }
);

// gets a list of all panels
router.get(
    '/',
    permission.required([{
        name : 'panel_resource',
        action : 'read'
    }]),
    view_all_devices
);

// create a new panel
router.post(
    '/',
    permission.required([{
        name : 'panel_resource',
        action : 'execute'
    }]),
    create_panel
);

router.param(
    'panel_id',
    function(req, res, next, id) {

        Panel.findById(
            id,
            function (err, panel){
                if (err) { next(err); return; }
                if (!panel) { next(new Error('can\'t find panel')); return; }

                req.panel = panel;
                return next();
            }
        );

    }
);

// update a panel
router.put(
    '/:panel_id',
    permission.required([{
        name : 'panel',
        action : 'write'
    }]),
    update_panel
);

// get details about a panel
router.get(
    '/:panel_id',
    permission.required([{
        name : 'panel',
        action : 'read'
    }]),
    view_panel
);

// delete a panel
router.delete(
    '/:panel_id',
    permission.required([{
        name : 'panel',
        action : 'write'
    }]),
    delete_panel
);
