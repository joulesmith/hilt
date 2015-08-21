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
var util = require('dbutilities');

var devices = require('../devices/dvDevices');

var Data = mongoose.model('dacData');

/*
    A channel is a particular method of acquiring/controling a device. A channel
    is not a specific pin, but the settings and triggers required to perform a complete
    measurement. A single physical io channel could have many channels configured to
    use it. When a channel is activated in the DAC, the settings are used to perform
    an action.

    A device is simply a group of hardware that share the same api which can be
    configured by a JSON object.
*/
var DeviceChannelSchema = new mongoose.Schema({
    hash :  { type: String, default: "" },
    // The device to which this channel belongs.
    device : { type: mongoose.Schema.Types.ObjectId, ref: 'dacDevice' },
    // a name for the channel
    name: {type: String, default: ""},
    settings : { type: String, default: "{}" },
    controllable : {type : Boolean, default : false},
    // Describes the general format of the data in/out by this channel.
    // data is stored as an array of arrays. Each array is a variable, which
    // can be stored as any JSON object: number, string, boolean, or object
    format : {
        in : {
            variable : [String], //  a descriptive string name for the variable array
            type : [String] // type of element in the array.
        },

        out: {
            variable : [String], //  a descriptive string name for the variable array
            type : [String] // type of element in the array.
        },

        control : {
            variable : [String], //  a descriptive string name for the variable array
            type : [String] // type of element in the array.
        }
    }

    active_data : { type: mongoose.Schema.Types.ObjectId, ref: 'dacData' },

    read : {type : Boolean, default : false},
    execute : {type : Boolean, default : false},
    write : {type : Boolean, default : false}
});

util.add_hash_methods(DeviceChannelSchema, {
    device : 'dacDevice',
    name : '',
    settings : '',
    controllable, '',
    format : ''
});


DeviceChannelSchema.methods.activate = function(cb){
    if (this.hash === ''){
        return cb(new Error("Cannot run channel until it has a hash"));
    }

    if (this.active_data) {
        // channel is already active
        return cb();
    }

    var new_data = new Data({channel: this});

    var cur_channel = this;

    new_data.open(cur_channel.format, function(err, data){
        if (err) {return cb(err);}

        cur_channel.active_data = data;

        cur_channel.save(function(err, channel){
            if (err) {
                data.remove();
                return cb(err);
            }

            devices.get_service(channel.device, function(err, service) {
                if (err) {return cb(err);}

                service.activate(channel, function(err) {
                    if (err) {
                        data.remove();
                        channel.active_data = null;
                        channel.save(function(_err){
                            cb(_err || err);
                        });
                    }
                });

            });


        });
    });

};

DeviceChannelSchema.methods.deactivate = function(cb){
    if (!this.active_data) {
        // channel is not active
        return cb();
    }

    var cur_channel = this;

    devices.get_service(cur_channel.device, function(err, service){
        if (err) {return cb(err);}

        service.deactivate(cur_channel, function(err) {
            cur_channel.active_data = null;

            cur_channel.save(function(_err){
                cb(_err || err);
            });
        });
    });

};

DeviceChannelSchema.methods.control = function(req, res) {

    if (!this.controllable || !this.active_data) {
        return res(new Error("Cannot control channel."));
    }

    var cur_channel = this;

    devices.get_service(this.device, function(err, service){
        if (err) {return res(err);}

        service.control(cur_channel, req, res);
    });

};

mongoose.model('dacChannel', DeviceChannelSchema);
