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

var ModelError = error('routes.api.location');


module.exports = function(server) {
    apimodelfactory(server, {
        location : {
            state : { // this is what will be stored in the database specific to each resource
                independent : { // what can be set directly
                    "firstName": String,
                    "lastName": String,
                    "company": String,
                    "streetAddress": String,
                    "extendedAddress": String,
                    "locality": String,
                    "region": String,
                    "postalCode": String,
                    "countryName": String,
                    "countryCodeAlpha2": String,
                    "countryCodeAlpha3": String,
                    "countryCodeNumeric": String,
                    "latitude" : Number, // degrees
                    "longitude": Number // degrees
                },
                dependent : { // what is set indirectly according to the api
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
            },
            safe : {
            },
            unsafe : {
            },
            // only accessible on the server
            internal : {
            }
        }
    });
};
