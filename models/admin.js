"use strict";

/**
 * Administration of settings for models.
 */

var apimodelfactory = require('./apifactory');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
var error = require('../error');
var Promise = require('bluebird');
var config = require('../config');
var mongoose = require('mongoose');

var AdminError = error('routes.api.admin');


module.exports = {
    admin : {
        authenticate : {
            write : true, // require user authorization and permission to do this
            read : true, //
            execute : true //
        },
        state : {
            independent : {
                name : {type : String, default : ''},
                settings : {type : String, default : ''},
            },
            dependent : {

            },
            index : null, // used for text searches
        },
        create : function(req, res) {
            // TODO: update server settings
            // server.api.[model].settings
        },
        update : function(req, res) {
            // TODO: update server settings
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
