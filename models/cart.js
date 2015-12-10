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

var ModelError = error('routes.api.cart');


module.exports = function(server) {
    apimodelfactory(server, {
        cart : {
            state : {
                independent : {
                    products : [{ type: mongoose.Schema.Types.ObjectId, ref: 'product', required : true}],
                },
                dependent : {
                },
                index : null, // used for text searches
            },
            create : null,
            get : {
                security : true
            }
            update : {
                security : true
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
