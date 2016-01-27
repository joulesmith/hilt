"use strict";

/**
 * Receipts for payments
 */

var apimodelfactory = require('./apifactory');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
var error = require('../error');
var Promise = require('bluebird');
var mongoose = require('mongoose');
var braintree = require('braintree');

var ModelError = error('routes.api.receipt');


module.exports = {
    receipt : {
        state : { // this is what will be stored in the database specific to each resource
            independent : { // what can be set directly
                // total amount, should be calculated from order
                amount : {type: Number, default: 0, required : true},
                to : { type: mongoose.Schema.Types.ObjectId, ref: 'account'},
                order : { type: mongoose.Schema.Types.ObjectId, ref: 'order'}
            },
            dependent : { // what is set indirectly according to the api
                payment_id : {type : String, default: ''}
            },
            index : null, // used for text searches
        },
        create: {
            creatorAccess: ['get', 'safe.paymentStatus', 'unsafe.submit', 'unsafe.payment'],
            handler: function(req) {
                var receipt = this;



                // TODO: this can be more sophisticated by defining interactions with the account
                // such as what to do automatiically (if anything) when receipts are generated to them?
                //
                return mongoose.model('account').findById('' + receipt.to)
                    .exec()
                    .then(function(account) {
                        if (!account) {
                            throw new ModelError('noaccount',
                                'The deposit account could not be found.', [],
                                404);
                        }

                        // give acceess to the account managers
                        return receipt.grantGroupAccess(['get', 'safe.paymentStatus'], account.managers);
                    });
            }
        },
        get : {
            secure : true
        },
        update : {
            secure : true,
            handler : function(req) {
                var receipt = this;

                // TODO: is this too strong? or just use security?
                throw new ModelError('methodnotallowed',
                    'A receipt cannot be directly changed once started.',
                    [],
                    405);
            }
        },
        // no restrictions to access, only uses http gets to base url
        static : {
            clientToken : {
                handler : function(req, res) {

                    return (new Promise(function(resolve, reject){
                        try {

                            req.api.settings.gateway.clientToken.generate({}, function (err, response) {
                                if (err) {
                                    return reject(err);
                                }

                                if (!response || !response.clientToken) {
                                    return reject(new ModelError('notoken',
                                        'No token was generated.',
                                        [],
                                        500));
                                }

                                resolve(response.clientToken);
                            });
                        }catch(error) {
                            reject(error);
                        }
                    }));

                }
            }
        },
        safe : {
            paymentStatus : {
                secure : true,
                handler : function(req, res) {
                    var receipt = this;
                    return (new Promise(function(resolve, reject){
                        req.api.settings.gateway.transaction.find(receipt.payment_id, function(error, result){
                            if (error) {
                                return reject(error);
                            }

                            resolve(result.transaction.status);
                        });
                    }));
                }
            }
        },
        unsafe : {
            payment : {
                secure : true,
                handler : function(req, res) {
                    var receipt = this;

                    return (new Promise(function(resolve, reject) {
                        try {
                            if (receipt.payment_id !== ''){
                                throw new ModelError('paymentmade',
                                    'Payment has already been made.', [],
                                    400);
                            }

                            if (!req.body.amount) {
                                throw new ModelError('noamount',
                                    'An amount to pay must be specified.', [],
                                    400);
                            }

                            req.api.settings.gateway.transaction.sale({
                                amount: Math.min(new Number(req.body.amount), receipt.amount),
                                paymentMethodNonce: req.body.paymentMethod,
                            }, function(err, result) {
                                if (err) {
                                    return reject(err);
                                }

                                resolve(result);
                            });
                        } catch (error) {
                            reject(error);
                        }
                    }))
                    .then(function(result){

                        receipt.payment_id = result.transaction.id;

                        return receipt.save();
                    });

                }
            },
            submit : {
                secure: true,
                handler : function(req, res) {
                    var receipt = this;

                    if (receipt.payment_id === ''){
                        throw new ModelError('nopayment',
                            'Payment has not been made to be submitted.', [],
                            400);
                    }

                    return (new Promise(function(resolve, reject) {
                        req.api.settings.gateway.transaction.submitForSettlement(receipt.payment_id, function(error, result) {
                            if (error){
                                return reject(
                                    new ModelError('braintree',
                                        'payment [0] could not be submitted for settlement.',
                                        [receipt.payment_id],
                                        500));
                            }

                            return resolve();
                        });
                    }));
                }
            }
        },
        // only accessible on the server
        internal : {
        },
        settings : function(settings){
            return {
                gateway : braintree.connect({
                  environment: braintree.Environment.Sandbox,
                  merchantId: "49xn27bktj5zht87",
                  publicKey: "ctxdfnbcqsw27w2m",
                  privateKey: "c79cb1dc8abf3a29eb420b41e2e5b423"
              })
            };
        }
    }
};
