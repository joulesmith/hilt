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
                clientToken : {
                    route : null,
                    handler : function(req, res) {
                        return (new Promise(function(resolve, reject){
                            try {
                                var gateway = braintree.connect({
                                  environment: braintree.Environment.Sandbox,
                                  merchantId: "49xn27bktj5zht87",
                                  publicKey: "ctxdfnbcqsw27w2m",
                                  privateKey: "c79cb1dc8abf3a29eb420b41e2e5b423"
                                });

                                gateway.clientToken.generate({}, function (err, response) {
                                    if (err) {
                                        console.log(err);
                                        return reject(err);
                                    }

                                    if (!response || !response.clientToken) {
                                        return reject(new Error('notoken',
                                            'No token was generated.',
                                            [],
                                            500));
                                    }

                                    res.json({clientToken : response.clientToken});
                                    resolve();
                                });
                            }catch(error) {
                                console.log(error);
                                reject(error);
                            }
                        }));

                    }
                },
            },
            // need execute permission, only uses http gets to specific resource
            safe : {},
            // need both execute and write permission, uses http posts to specific resource
            unsafe : {
                payment : {
                    route : null,
                    handler : function(req, res) {
                        var account = this;

                        return (new Promise(function(resolve, reject){
                                try {
                                    var gateway = braintree.connect({
                                      environment: braintree.Environment.Sandbox,
                                      merchantId: "49xn27bktj5zht87",
                                      publicKey: "ctxdfnbcqsw27w2m",
                                      privateKey: "c79cb1dc8abf3a29eb420b41e2e5b423"
                                    });

                                    gateway.transaction.sale({
                                        amount: '10.00',
                                        paymentMethodNonce: req.body.paymentMethod,
                                    }, function(err, result) {
                                        if (err) {
                                            return reject(err);
                                        }

                                        resolve(result);
                                    });
                                }catch(error) {
                                    reject(error);
                                }
                            })).then(function(result){
                                account.transactions.push(result);
                                return account.save();
                            }).then(function(account){
                                res.json({

                                });
                            });

                    }
                }
            },
            // only accessible on the server
            internal : {},
            io : {
                event : {}
            }
        }
    });
};
