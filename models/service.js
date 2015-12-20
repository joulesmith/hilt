"use strict";


var apimodelfactory = require('./apifactory');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
var error = require('../error');
var Promise = require('bluebird');
var config = require('../config');
var mongoose = require('mongoose');

var ModelError = error('routes.api.service');


module.exports = {
    service : {
        state : {
            independent : {
                // payable to for service
                account : { type: mongoose.Schema.Types.ObjectId, ref: 'account', required : true},
                // short name of service
                name : {type: String, default: '', required: true},
                // base price of the service
                price : Number, // USD
                duration : Number, // millisecond duration the service typically takes to perform
                // choices that adjust the price and/or duration of the service
                choice : [{
                    required : Boolean, // is making this choice required to complete service?
                    name : String,
                    default : Number, // index of the default option, or -1 if no default
                    option : [{
                        name : String,
                        priceAdjustment : Number, // USD
                        durationAdjustment : Number, // (ms)
                    }]
                }],
                // subscription details if this service is recurring
                subscription : {
                },
                // times at which this service will be available
                schedule : [{
                    start : Number, // unix time code in milliseconds of when service can be started
                    end : Number // last millisecond when the service must be finished
                }]
            },
            dependent : {
                // all past orders that have been made of this service
                order : [{ type: mongoose.Schema.Types.ObjectId, ref: 'order'}],
                // appointments made for the service at a future date
                appointments : [{ type: mongoose.Schema.Types.ObjectId, ref: 'order'}]
            },
            index : null, // used for text searches
        },
        create : {

        },
        get : {
            security : false
        }
        update : {
            security : true,
            handler : function(req) {
                if (this.available) {
                    throw new ModelError('methodnotallowed',
                        'A product cannot be directly changed once it is made available.',
                        [],
                        405);
                }
            }
        },
        // no restrictions to access, only uses http gets to base url
        static : {
        },
        // need execute permission, only uses http gets to specific resource
        safe : {},
        // need both execute and write permission, uses http posts to specific resource
        unsafe : {},
        // only accessible on the server
        internal : {}
    }
};
