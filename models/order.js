"use strict";

var apimodelfactory = require('./apifactory');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
var error = require('../error');
var Promise = require('bluebird');
var config = require('../config');
var mongoose = require('mongoose');
var braintree = require('braintree');

var ModelError = error('routes.api.order');


module.exports = {
    order : {
        state : { // this is what will be stored in the database specific to each resource
            independent : { // what can be set explicitly
                product : [{ type: mongoose.Schema.Types.ObjectId, ref: 'product'}],
                service : [{ type: mongoose.Schema.Types.ObjectId, ref: 'service'}],
                delivery : {
                    // unix time at which the product/service will be delivered/started
                    time : Number,
                    // location at which the product/service will be delivered
                    location : { type: mongoose.Schema.Types.ObjectId, ref: 'location'}
                },
                notify : {
                    email : String,
                }
            },
            dependent : { // what is set implicitly according to the api
                receipt : { type: mongoose.Schema.Types.ObjectId, ref: 'receipt'},
                shipping : {
                    method : String,
                    rate : Number,
                    tracking : String
                },
                review : mongoose.Schema.Types.Mixed
            },
            index : null, // used for text searches
        },
        create: {
            creatorAccess: ['get', 'update'],
            handler: function(req) {
                var order = this;
            }
        },
        get : {
            secure : true
        },
        update : {
            secure : true,
            handler : function(req) {
                var order = this;

            }
        },
        // no restrictions to access, only uses http gets to base url
        static : {
        },
        safe : {
        },
        unsafe : {

        },
        // only accessible on the server
        internal : {
        }
    }
};
