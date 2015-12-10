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
var config = require('../config');
var mongoose = require('mongoose');
var braintree = require('braintree');

var ModelError = error('routes.api.receipt');


module.exports = function(server) {
    apimodelfactory(server, {
        receipt : {
            state : { // this is what will be stored in the database specific to each resource
                independent : { // what can be set directly
                    amount : {type: Number, default: 0, required : true},
                    to : { type: mongoose.Schema.Types.ObjectId, ref: 'account'},
                    order : { type: mongoose.Schema.Types.ObjectId, ref: 'order'}
                },
                dependent : { // what is set indirectly according to the api
                    payment : {type : String}
                },
                index : null, // used for text searches
            },
            create : function(req) {
                var receipt = this;

                // TODO: this can be more sophisticated by defining interactions with the account

                return mongoose.model('account').findById('' + receipt.to)
                    .exec()
                    .then(function(account){
                        if (!account) {
                            throw new ModelError('noaccount',
                                'The deposit account could not be found.',
                                [],
                                404);
                        }

                        // give acceess to the account
                        // TODO: it should really have the same permissions as the account, but how?
                        receipt.security.get.one.push('user_' + account.owner);
                        receipt.security.safe.paymentStatus.one.push('user_' + account.owner);
                        receipt.security.unsafe.approve.one.push('user_' + account.owner);

                        return receipt.save();
                    });
            },
            get : {
                security : true
            },
            update : {
                security : true,
                handler : function(req) {
                    var receipt = this;

                    throw new ModelError('methodnotallowed',
                        'A receipt cannot be changed once started.',
                        [],
                        405);
                }
            },
            // no restrictions to access, only uses http gets to base url
            static : {
                clientToken : {
                    route : null,
                    handler : function(req, res) {
                        var receipt = this;

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
                security : true,
                paymentStatus : {
                    route: null,
                    handler : function(req, res) {
                        var receipt = this;
                        return receipt.paymentStatus()
                        .then(function(status){
                            res.json({
                                paymentStatus : status
                            });
                        })
                    }
                }
            },
            unsafe : {
                security : true,
                approve : {
                    route : null,
                    handler : function(req, res) {
                        var receipt = this;

                        return (new Promise(function(resolve, reject){
                            try {

                                if (receipt.fromApproved !== true && req.user._id === receipt.owner) {
                                    receipt.fromApproved = true;
                                    resolve(receipt);
                                }else if (receipt.toApproved !== true){

                                    mongoose.model('account').findById(receipt.to)
                                        .exec()
                                        .then(function(account){
                                            if (!account || account.owner !== req.user._id) {
                                                throw new Error('noaccount',
                                                    'Your account could not be found.',
                                                    [],
                                                    404);
                                            }

                                            receipt.toApproved = true;

                                            resolve(receipt);
                                        }, function(error){
                                            reject(error);
                                        });
                                }else{
                                    resolve(receipt);
                                }

                            }catch(error) {
                                reject(error);
                            }
                        }))
                        .then(function(receipt){
                            return receipt.save();
                        })
                        .then(function(receipt){
                            if (receipt.toApproved && receipt.fromApproved){
                                return receipt.submitForSettlement().return(receipt);
                            }else{
                                return receipt;
                            }
                        });

                    }
                },
                payment : {
                    route : null,
                    handler : function(req, res) {
                        var receipt = this;

                        return receipt.paymentStatus()
                        .then(function(status) {
                            // amount left needed to be authorized
                            var requiredAmount = receipt.amount
                                - status.authoried.total
                                - status.submitted_for_settlement.total
                                - status.settling.total
                                - status.settled.total
                                - status.settlement_pending.total;

                            return (new Promise(function(resolve, reject) {
                                try {
                                    if (!req.body.amount) {
                                        throw new ModelError('noamount',
                                            'An amount to pay must be specified.', [],
                                            400);
                                    }

                                    var gateway = braintree.connect({
                                        environment: braintree.Environment.Sandbox,
                                        merchantId: "49xn27bktj5zht87",
                                        publicKey: "ctxdfnbcqsw27w2m",
                                        privateKey: "c79cb1dc8abf3a29eb420b41e2e5b423"
                                    });

                                    gateway.transaction.sale({
                                        amount: Math.min(new Number(req.body.amount), requiredAmount),
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
                        })
                        .then(function(result){

                            receipt.payments.push(result.transaction.id);

                            return receipt.save();
                        });

                    }
                }
            },
            // only accessible on the server
            internal : {
                paymentStatus : function() {

                    var accumulator = {
                        authorizedAmount : 0,
                        submittedAmount : 0,

                    };

                    return Promise.reduce(receipt.payments, function(accumulator, payment) {
                        return (new Promise(function(resolve, reject) {
                            gateway.transaction.find(payment, function(error, result){
                                if (error) {
                                    return reject(error);
                                }

                                try{
                                    if (!accumulator[result.transaction.status])
                                    {
                                        accumulator[result.transaction.status] = {
                                            payments : [],
                                            total : 0
                                        };
                                    }

                                    accumulator[result.transaction.status].payments.push({
                                        id : payment,
                                        created : result.transaction.createdAt,
                                        amount : result.transaction.amount
                                    });

                                    accumulator[result.transaction.status].total += result.transaction.amount;

                                    resolve(accumulator);
                                }catch(error) {
                                    reject(error);
                                }

                            });
                        }));
                    }, accumulator);
                },
                submitForSettlement : function() {
                    var receipt = this;

                    var accumulator = {
                        submitted : 0
                    };

                    return receipt.paymentStatus()
                    .then(function(status){
                        // amount left needed to be submitted
                        var requiredAmount = receipt.amount
                            - status.submitted_for_settlement.total
                            - status.settling.total
                            - status.settled.total
                            - status.settlement_pending.total;

                        if (!receipt.fromApproved || !receipt.toApproved) {
                            throw new ModelError('noapproval',
                                'payment cannot be settled until both parties approve.',
                                [],
                                400);
                        }

                        // only submit payments that are authorized
                        return Promise.reduce(status.authorized.payments, function(accumulator, payment) {
                            return (new Promise(function(resolve) {
                                gateway.transaction.submitForSettlement(payment, function(error, result) {
                                    if (error){
                                        return reject(
                                            new ModelError('braintree',
                                                'payment [0] could not be submitted for settlement.',
                                                [payment],
                                                500));
                                    }

                                    if (result.status === 'submitted_for_settlement') {
                                        accumulator.submitted += new Number(result.transaction.amount);
                                    }

                                    return resolve(accumulator);
                                });
                            }));
                        }, accumulator);
                    });

                }
            }
        }
    });
};
