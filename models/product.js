"use strict";

/**
 * 1715, "to represent in profile," from profile (n.) or Italian profilare. Meaning "to summarize a person in writing" is from 1948
 */

var apimodelfactory = require('./apifactory');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
var error = require('../error');
var Promise = require('bluebird');
var config = require('../config');
var mongoose = require('mongoose');

var ModelError = error('routes.api.product');


module.exports = function(server) {
    apimodelfactory(server, {
        product : {
            state : {
                independent : {
                    account : { type: mongoose.Schema.Types.ObjectId, ref: 'account', required : true},
                    name : {type: String, default: '', required: true},
                    amount : {type: Number, default: 0},
                    physical : {type: Boolean, default: false, required: true}
                },
                dependent : {
                    available : {type: Boolean: default: false},
                    // only if physical is false
                    inventory : {type: Number, default: 0},
                    sales : [{ type: mongoose.Schema.Types.ObjectId, ref: 'receipt'}]
                },
                index : null, // used for text searches
            },
            create : null,
            get : {
                security : false
            }
            update : {
                security : true,
                handler : function(req) {
                    throw new ModelError('methodnotallowed',
                        'A product cannot be changed once created.',
                        [],
                        405);
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
    });
};
