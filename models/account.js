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

var ModelError = error('routes.api.account');


module.exports = {
    account : {
        state : {
            independent : {
                acctName : {type : String, default : ''},
            },
            dependent : {
                balance : {type: Number, default: 0},
                braintree : {
                    customerId: {type : String, default : ''},
                    paymentMethods : [{type : String, default : ''}],
                    transactions : [mongoose.Schema.Types.Mixed],
                },
                products : [{ type: mongoose.Schema.Types.ObjectId, ref: 'product'}],
                services : [{ type: mongoose.Schema.Types.ObjectId, ref: 'service'}],
                managers : { type: mongoose.Schema.Types.ObjectId, ref: 'group'},
            },
            index : {acctName : 'text'}, // used for text searches
        },
        create : {

        },
        get : {
            secure : true
        },
        update : {
            secure : true
        },
        // no restrictions to access, only uses http gets to base url
        static : {
            search : {
                route : null,
                params : ['words'],
                handler : function(req, res) {

                    return mongoose.model('account').find(
                        { $text : { $search : '' + req.query.words } },
                        { _id : 1, score : { $meta: "textScore" } } // don't return whole document since anyone can access this
                    )
                    .sort({ score : { $meta : 'textScore' } })
                    .exec()
                    .then(function(accounts){
                        if (!accounts) {
                            throw new ModelError('noresults',
                                'No accounts found matching search words.',
                                [],
                                404);
                        }

                        return accounts;
                    });
                }
            }
        },
        safe : {
            name : {
                secure: false,
                handler : function(req, res) {

                }
            }
        },
        // need both execute and write permission, uses http posts to specific resource
        unsafe : {

        },
        // only accessible on the server
        internal : {}
    }
};
