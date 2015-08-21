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

var Device = mongoose.model('dacDevice');
var Channel = mongoose.model('dacChannel');
var DataOut = mongoose.model('dacDataOut');
var DataIn = mongoose.model('dacDataIn');
var Resource = mongoose.model("dacResource");

var util = require('rt_utilities.js');

var channels = require('../devices/dvChannels');

/**
    Responds with a specific device and populates the channel array of the device
*/
var view_device = function(req, res, next) {

    res.json(req.device);
};

var view_all_devices = function(req, res, next) {

    Device.find(function(err, devices){
        if(err){ next(err); return; }

        res.json(devices);
    });
};

/**
    Responds with a specific channel.
*/
var view_channel = function(req, res, next) {
    res.json(req.channel);
};

/**

*/
var create_channel = function(req, res, next) {

    if (req.device.hash !== "")
    {
        // only add channel if device has a hash

        var channel = new Channel({
            name : req.name,
            device : req.device,
            settings : req.settings,
            state_format : req.state_format,
            series_format : req.series_format
        });

        channel.save(function(err, channel){
            if(err){ next(err); return; }

            if (req.finalize) {
                channel.setHash(function(err, channel){
                    if(err){ next(err); return; }

                    res.json(channel);
                });
            }else{
                res.json(channel);
            }

        }
    }else{
        res.sendStatus(403);
    }
};

var update_channel = function(req, res, next) {
    if (req.channel.hash === '') {
        // only update if hash has not been computed
        if (req.name) req.channel.name = req.name;
        if (req.settings) req.channel.settings = req.settings;
        if (req.state_format) req.channel.state_format = req.state_format;
        if (req.series_format) req.channel.series_format = req.series_format;



        req.channel.save(function(err, channel){
            if(err){ next(err); return; }

            if (req.finalize) {
                channel.setHash(function(err, channel){
                    if(err){ next(err); return; }

                    res.json(channel);
                });
            }else{
                res.json(channel);
            }


        });
    }else{
        res.sendStatus(403);
    }

};

var delete_channel = function(req, res, next) {
    if (req.channel.hash === '') {
        req.channel.remove();

        res.sendStatus(200);
    }else{
        res.sendStatus(403);
    }

};


var activate_channel = function(req, res, next) {

    if (req.channel.hash === '') {
        res.sendStatus(403);
    }else{

    }
};

var view_data_in = function(req, res, next) {

    res.json(req.data_in);
};

var view_data_out = function(req, res, next) {

    res.json(req.data_out);
};

// channel data can be viewed chronologically, as well as by input vs output.

var view_data_out_query = function(req, res, next) {

    var t_ref = 0;

    if (!req.query.tmin) {
        req.query.tmin = t_ref;
    }else{
        t_ref =  (new Date(req.query.tmin)).getTime();
    }

    if (!req.query.tmax) {
        req.query.tmax = Date.now();
    }

    if (req.query.format === 'times') {

        // if all they want are the times, then it's simple.
        var query = DataOut.find({
            channel : req.channel._id,
            t0 : {$lt : new Date(req.query.tmax)},
            t1 : {$gt : new Date(req.query.tmin)}
        },{
            t0 : 1,
            t1 : 1
        }, function(err, datas){
            res.json(datas);
        });

    else if (req.query.format === 'slice'){
        //
        DataOut.find({
            channel : req.channel._id,
            t0 : {$lt : new Date(req.query.tmax)},
            t1 : {$gt : new Date(req.query.tmin)}
        },{
            t0 : 1,
            series : 1,
            time : 1
        }, function(err, datas) {
            if (err) {next(err); return;}

            if (req.query.format === 'raw') {
                res.json(datas);
            }else if (req.query.format === 'unified') {

                if (datas.length === 0) {
                    res.json({});
                }else if (datas.length === 1) {

                    var data = datas[0];

                    var T0 = (data.t0.getTime() - t_ref)/1000.0;

                    var t0 = data.time[0] + T0;
                    var t1 = data.time[data.time.length-1] + T0;

                    var resData = {};

                    if (t0 >= 0 && t1 <= t_max) {
                        // no trimming, but need to shift times
                        resData.series = data.series;
                        resData.time = new Array(data.time.length);

                        for(var i = 0; i < data.time.length; i++) {
                            resData.time[i] = data.time[i] + T0;
                        }

                        res.json(resData);
                    }else{

                        // needs trimming. Find the points that need to be cut
                    }
                }else{

                }
            }
        });
    }
};

var view_channel_data_in_times = function(req, res, next) {

    var query = DataIn.find({
        channel : req.channel._id
    });

    if (req.t0) {
        query = query.where('t1').gt(req.t0);
    }

    if (req.t1) {
        query = query.where('t0').lt(req.t1);
    }

    query = query.select('t0 t1');


    query.exec(function(err, times) {
        if (err) {next(err); return;}

        res.json(times);
    });

};

router.use(
    '/',
    function(req, res, next){
        Resource.findOne({
            'name' : 'device'
        }, function(err, device){
            if (err) {return next(err);}

            if (!device) { next(new Error('can\'t find device resource')); return; }

            req.device_resource = device;
            next();
        });
    }
);

router.param(
    'device_name',
    function(req, res, next, device_name) {

        Device.findOne({ name : device_name }, function (err, device){
            if(err){ next(err); return; }
            if (!device) { next(new Error('can\'t find device')); return; }

            req.device = device;
            return next();
        });
    }
);

router.param('channel_id', function(req, res, next, id) {

    Channel.findOne({
        _id: id,
        device : req.device._id
    }, function (err, channel){
        if (err) { next(err); return; }
        if (!channel) { next(new Error('can\'t find channel')); return; }

        req.channel = channel;
        return next();
    });

});

router.param('data_in_id', function(req, res, next, id) {

    DataIn.findOne({
        _id: id,
        channel : req.channel._id
    }, function (err, data){
        if (err) { next(err); return; }
        if (!data) { next(new Error('can\'t find data')); return; }

        req.data_in = data;
        return next();
    });

});

router.param('data_out_id', function(req, res, next, id) {

    DataOut.findOne({
        _id: id,
        channel : req.channel._id
    }, function (err, data){
        if (err) { next(err); return; }
        if (!data) { next(new Error('can\'t find data')); return; }

        req.data_out = data;
        return next();
    });

});



// gets a list of all devices
router.get(
    '/',
    permission.required([{
        name : 'device_resource',
        action : 'read'
    }]),
    view_all_devices
);

// get details about a device
router.get(
    '/:device_name',
    permission.required([{
        name : 'device',
        action : 'read'
    }]),
    view_device
);

// create a channel
router.post(
    '/:device_name/channel',
    permission.required([{
        name: 'device',
        action : 'execute'
    }]),
    create_channel
);

// get details about a channel
router.get(
    '/:device_name/channel/:channel_id',
    permission.required([{
        name: 'channel',
        action : 'read'
    }]),
    view_channel
);


// update details about channel, and/or finalize channel
router.put(
    '/:device_name/channel/:channel_id',
    permission.required([{
        name: 'channel',
        action : 'write'
    }]),
    update_channel
);

// delete a channel
router.delete(
    '/:device_name/channel/:channel_id',
    permission.required([{
        name: 'channel',
        action : 'write'
    }]),
    delete_channel
);

// activate/deactivate channel for data io, or adjust parameters.
// a channel could be self-deactivating, but multilple activations will have no
// effect until the channel is deactivated.
router.put(
    '/:device_name/channel/:channel_id/data',
    permission.required([{
        name: 'channel',
        action : 'execute'
    }]),
    activate_channel
);

// get data generated by channel
router.get(
    '/:device_name/channel/:channel_id/data/out',
    permission.required([{
        name: 'channel',
        action : 'read'
    }]),
    view_data_out_query
);

// get data generated by channel
router.get(
    '/:device_name/channel/:channel_id/data/out/:data_out_id',
    permission.required([{
        name: 'channel',
        action : 'read'
    }]),
    view_data_out
);


router.get(
    '/:device_name/channel/:channel_id/data/in',
    permission.required([{
        name: 'channel',
        action : 'read'
    }]),
    view_channel_data_in_query
);

// get data generated by channel
router.get(
    '/:device_name/channel/:channel_id/data/in/:data_in_id',
    permission.required([{
        name: 'channel',
        action : 'read'
    }]),
    view_data_in
);

// adds/remove channel to live stream to a particular panel
router.put(
    '/:device_name/channel/:channel_id/data/live/:panel_id',
    permission.required([{
        name: 'channel',
        action : 'read'
    }]),
    function(req, res, next) {

    }
);

// the websocket connection
