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

var io = require('../server').get_io();

var DataSchema = new mongoose.Schema({
    hash :  { type: String, default: "" },

    // a particular configuration of the channel.
    channel : { type: mongoose.Schema.Types.ObjectId, ref: 'dacChannel' },
    // trigger data provides a common reference between more precise time measurments
    trigger : { type: mongoose.Schema.Types.ObjectId, ref: 'dacData', default: null },

    // a series of data
    // this is used to hold a time series which all have equal formatting.
    // such as for a voltage/time measurement. This is so it can be added to and viewed
    // as if they are frames of a movie.
    in : [],
    out : [],
    time : {type : [Number], default: []}, // units in seconds of data points
    t0 : {type : Number, default: 0}, // unix time in seconds of time[0], floating point
    t1 : {type : Number, default: 0}, // unix time of time[length-1]
});

util.add_hash_methods(DataSchema, {
    channel : 'dacChannel',
    trigger : 'dacData',
    t0 : '',
    t1 : '',
    in : '',
    out : '',
    time : ''
});

DataSchema.methods.open = function(format, cb){

    for(var i = 0; i < format.in.variable.length; i++) {
        this.in.push([]);
    }

    for(i = 0; i < format.out.variable.length; i++) {
        this.out.push([]);
    }

    this.save(cb);
};

DataSchema.methods.close = function(cb){

    var delta_t = this.time[this.time.length-1] - this.time[0];

    if (this.trigger === null) {
        // if there is no trigger, then the best we can do is guess the current
        // time provided by the system
        this.t0 = Date.now()/1000;


        this.t1 = this.t0 + delta_t;

        this.save(function(err, data){
            if (err){return cb(err);}
            data.setHash(cb);
        });

    }else{
        // if there is a trigger, then the start time is made relative to another
        // piece of data. The times are then relative to the trigger time series.

        var cur_data = this;

        mongoose.model('dacData').findById(cur_data.trigger, function(err, trigger_data){
            if (err) {return cb(err);}

            cur_data.t0 = trigger_data.t0 + data.time[0] - trigger_data.time[0];

            cur_data.t1 = cur_data.t0 + delta_t;

            cur_data.save(function(err, data){
                if (err){return cb(err);}

                data.setHash(cb);
            });
        });
    }
};

DataSchema.methods.data = function(data, cb) {
    if (this.hash !== '') {
        return cb();
    }

    // make sure they have similar format
    if (this.in.length !== data.in.length || this.out.length !== data.out.length){
        return cb();
    }

    var t_length = data.time.length;
    var same = true;

    // make sure all variables contain same number of units

    for(var i = 0; i < data.in.length; i++) {
        same = same && data.in[i].length === t_length;
    }

    for(var i = 0; i < data.out.length; i++) {
        same = same && data.out[i].length === t_length;
    }

    if (!same) {
        return cb();
    }

    if (this.time.length === 0 || data.time[0] >= this.time[this.time.length - 1]){

        // add the data to the end of the series
        // this assums that all data is added in the correct order
        this.time = this.time.concat(data.time);

        for(var i = 0; i < data.in.length; i++) {
            this.in[i] = this.in[i].concat(data.in[i]);
        }

        for(var i = 0; i < data.out.length; i++) {
            this.out[i] = this.out[i].concat(data.out[i]);
        }
    }else{

        return cb(new Error("Can't handle data out of order."));
    }

    // send data to channel's room
    // this is done before the data is saved to the database. but hopfully
    // there will not be problems too often of data not being saved.
    io.to("data_" + this.channel).emit("data_" + this.channel, data);

    this.save(cb);

}


mongoose.model('dacData', DataSchema);
