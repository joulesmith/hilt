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

var AdminError = error('routes.api.admin');


module.exports = function(server) {
    apimodelfactory(server, {
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
            },
            update : function(req, res) {
                // TODO: update server settings
            },
            // no restrictions to access, only uses http gets to base url
            static : {
                summary : {
                    route : null,
                    handler : function(req, res) {

                        return mongoose.model('admin').find(
                            { $text : { $search : '' + req.query.words } },
                            { "_id": 1, score : { $meta: "textScore" } }
                        )
                        .sort({ score : { $meta : 'textScore' } })
                        .exec()
                        .then(function(profile){
                            if (!profile) {
                                throw new ProfileError('noresults',
                                    'No profiles found matching search words.',
                                    [],
                                    404);
                            }

                            res.json({
                                profile : profile
                            });
                        });
                    }
                }
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
