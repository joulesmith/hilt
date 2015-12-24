"use strict";

var apimodelfactory = require('./apifactory');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
var error = require('../error');
var Promise = require('bluebird');
var config = require('../config');
var mongoose = require('mongoose');

var ModelError = error('routes.api.product');


module.exports = {
    product : {
        state : {
            independent : {
                account : { type: mongoose.Schema.Types.ObjectId, ref: 'account', required : true},
                name : {type: String, default: '', required: true},
                details : {
                    manufacturer : String,
                    partNumber : String,
                    specification : mongoose.Schema.Types.Mixed,
                    package: {
                        length : Number,
                        width : Number,
                        height: Number,
                        weight: Number
                    }
                },
                price : Number, // USD
                choice : [{
                    required : Boolean,
                    name : String,
                    option : [{
                        name : String,
                        priceAdjustment : Number
                    }]
                }]

            },
            dependent : {
                forSale : {type: Boolean, default: false},
                introduced : {type: Number, default: 0}, // time at which it is made available
                discontinued : {type: Number, default: 0}, // time at which it was discontinued
                // only if physical is false
                inventory : {
                    quantity : {type: Number, default: 0},
                    serialNumbers : [String],
                    // where are the items to be shipped from?
                    address :  { type: mongoose.Schema.Types.ObjectId, ref: 'address'}
                },
                shippingServices : [String],
                orders : [{ type: mongoose.Schema.Types.ObjectId, ref: 'order'}]
            },
            index : null, // used for text searches
        },
        create : {

        },
        get : {
            security : false
        },
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
