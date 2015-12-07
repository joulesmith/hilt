"use strict";

/**
 * Account for keeping track of payments
 */

var apimodelfactory = require('./apifactory');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
var error = require('../error');
var Promise = require('bluebird');
var config = require('../config');
var mongoose = require('mongoose');
var braintree = require('braintree');

var Error = error('routes.api.account');


module.exports = function(server) {
    apimodelfactory(server, {
        account : {
            authenticate : {
                write : true, // require user authorization and permission to do this
                read : true, //
                execute : true //
            },
            state : {
                independent : {
                    acctName : {type : String, default : ''},

                },
                dependent : {
                    balance : {type: Number, default: 0},
                    braintree : {
                        customerId: {type : String, default : ''},
                        paymentMethods : [{type : String, default : ''}],
                        transactions : [mongoose.Schema.Types.Mixed]
                    }

                },
                index : null, // used for text searches
            },
            create : null,
            update : null,
            // no restrictions to access, only uses http gets to base url
            static : {

            },
            // need execute permission, only uses http gets to specific resource
            safe : {},
            // need both execute and write permission, uses http posts to specific resource
            unsafe : {

            },
            // only accessible on the server
            internal : {},
            io : {
                event : {}
            }
        }
    });
};
