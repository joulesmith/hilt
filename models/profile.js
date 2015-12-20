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

var ModelError = error('routes.api.profile');


module.exports = {
    profile : {
        state : {
            independent : {
                name : {type : String, default : ''},
                data : {type : String, default : '[]'}
            },
            dependent : {
            },
            index : { name: 'text', data: 'text'}, // used for text searches
        },
        create : null,
        update : {
            secure : true
        },
        // no restrictions to access, only uses http gets to base url
        static : {
            search : {
                handler : function(req, res) {

                    return mongoose.model('profile').find(
                        { $text : { $search : '' + req.query.words } },
                        { _id : 1, score : { $meta: "textScore" } } // don't return whole document since anyone can access this
                    )
                    .sort({ score : { $meta : 'textScore' } })
                    .exec()
                    .then(function(profile){
                        if (!profile) {
                            throw new ModelError('noresults',
                                'No profiles found matching search words.',
                                [],
                                404);
                        }

                        return profile;
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
};
