"use strict";


var apimodelfactory = require('./apifactory');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
var error = require('../error');
var Promise = require('bluebird');
var config = require('../config');
var mongoose = require('mongoose');
var crypto = require('crypto');

var crypto_pbkdf2 = Promise.promisify(crypto.pbkdf2);

var ModelError = error('routes.api.contact');

module.exports = {
    contact : {
        state : { // this is what will be stored in the database specific to each resource
            independent : { // what can be set directly
                email : String,
                phone : String
            },
            dependent : { // what is set indirectly according to the api
                emailVerified : Boolean,
                phoneVerified: Boolean,
                smsOut : [{
                    time : Number, // unix (ms) time of the message
                    body : String
                }],
                voiceOut : [{
                    time : Number, // unix (ms) time of the message
                    bodyTwiML : String,
                    response : String // ?
                }]
            },
            index : null, // used for text searches
        },
        create: {
            creatorAccess: ['get']
        },
        get : {
            secure : true
        },
        update : {
            secure : true
        },
        // no restrictions to access, only uses http gets to base url
        static : {
            sms : {
                handler : function(req, res) {
                    var Contact = mongoose.model('contact');

                    if (!req.headers || !req.headers.authorization || req.headers.authorization === ''){
                        throw new ModelError('noauthorization',
                            'Request is not authorized', [],
                            403);

                    }

                }
            }
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
