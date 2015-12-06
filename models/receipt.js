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

var Error = error('routes.api.transaction');


module.exports = function(server) {
    apimodelfactory(server, {
        receipt : {
            authenticate : {
                write : true, // require user authorization and permission to do this
                read : true, //
                execute : true //
            },
            state : {
                independent : {
                    amount : {type: Number, : default: 0},
                    from : { type: mongoose.Schema.Types.ObjectId, ref: 'account'},
                    to : { type: mongoose.Schema.Types.ObjectId, ref: 'account'}
                },
                dependent : {
                    fromAccept : {type: Boolean, default: false},
                    toAccept : {type: Boolean, default: false},
                    transactionId : {type : String, default : ''}
                },
                index : null, // used for text searches
            },
            create : function(req) {
                // add attributes to grant access.
            },
            update : function(req) {
                throw new Error('methodnotallowed',
                    'A receipt cannot be changed once started.',
                    [],
                    405);
            },
            // no restrictions to access, only uses http gets to base url
            static : {
                token : {
                    route : null,
                    handler : function(req, res) {
                        return (new Promise(resolve, reject){
                            try {
                                gateway.clientToken.generate({}, function (err, response) {
                                    if (err) {
                                        return reject(err);
                                    }

                                    res.send(response.clientToken);
                                    resolve();
                                });
                            }catch(error) {
                                reject(error);
                            }
                        });
                    }
                }
            },
            // need execute permission, only uses http gets to specific resource
            safe : {},
            // need both execute and write permission, uses http posts to specific resource
            unsafe : {
                accept : {
                    route : '/:account',
                    handler : function(req, res) {
                        try {
                            var receipt = this;

                            return mongoose.model('account').findById(req.params.account)
                                .exec()
                                .then(function(account){
                                    if (!account || account.owner !== req.user._id) {
                                        throw new Error('noaccount',
                                            'Your account could not be found.',
                                            [],
                                            404);
                                    }

                                    if (receipt.from === account._id) {
                                        if (receipt.fromAccept === true) {
                                            return receipt;
                                        }

                                        receipt.fromAccept = true;
                                    }else if (receipt.to === account._id) {
                                        if (receipt.toAccept === true) {
                                            return receipt;
                                        }

                                        receipt.toAccept = true;
                                    }else{
                                        throw new Error('invalid',
                                            'An error has occured with the transaction.',
                                            [],
                                            500);
                                    }

                                    if (receipt.toAccept && receipt.fromAccept) {
                                        // submit transaction
                                        return Promise.promisify(gateway.transaction.submitForSettlement)(receipt.transactionId)
                                        .then(function (result) {
                                            if (result.transaction.status !== submitted_for_settlement) {
                                                throw new Error('invalid',
                                                    'An error has occured with the transaction.',
                                                    [],
                                                    500);
                                            }

                                            return receipt.save();
                                        });
                                    }else{
                                        return receipt.save();
                                    }


                                }).then(function(receipt){
                                    res.json({})
                                });

                        }catch(error) {
                            reject(error);
                        }

                    }
                },

            },
            // only accessible on the server
            internal : {},
            io : {
                event : {}
            }
        }
    });
};
