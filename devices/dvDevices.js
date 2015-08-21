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

var mongoose = require('mongoose');
var Device = mongoose.model('dacDevice');
var Channel = mongoose.model('dacChannel');
var DataOut = mongoose.model('dacDataOut');
var DataIn = mongoose.model('dacDataIn');

var devices = {};

// the device services currently available.
exports.register = function(device_id, service) {

    if (devices[device_id]) {
        return;
    }

    devices[device_id] = service;
};

exports.get_service(device_id, cb) {
    if (!devices[device_id]) {
        return cb(new Error("Service cannot be found."));
    }

    cb(null, devices[device_id]);
};
