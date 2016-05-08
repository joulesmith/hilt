"use strict";

var Promise = require('bluebird');
var braintree = require('braintree');
var xoauth2 = require('xoauth2');
var crypto = require('crypto');
var crypto_pbkdf2 = Promise.promisify(crypto.pbkdf2);


module.exports = function(api){
  var gateway;

  return {
    payment: {
      settings: {
        sandbox : true,
        merchantId: '',
        publicKey: '',
        privateKey: ''
      },
      configure: function(){

        if (!api.payment.settings.merchantId || !api.payment.settings.publicKey || !api.payment.settings.privateKey) {
          console.log("Braintree has not been configured.");
          return;
        }

        gateway = braintree.connect({
          environment: api.payment.settings.sandbox ? braintree.Environment.Sandbox : braintree.Environment.Sandbox,
          merchantId: api.payment.settings.merchantId,
          publicKey: api.payment.settings.publicKey,
          privateKey: api.payment.settings.privateKey
        });
      },
      state: {
        independent: {
          amount: {
            type: Number,
            default: 0.0
          },
          recipient: { type: api.types.ObjectId, ref: 'user' }
        },
        dependent: {
          transaction_id: {
            type: String,
            default: ''
          }
        },
        index: { },
      },
      static: {
        view: {
          'client-token' : {
            handler: function(req, res) {
              return new Promise(function(resolve, reject) {
                try {
                  gateway.clientToken.generate({}, function (err, response) {
                    err ? reject(err) : resolve(response.clientToken);
                  });
                }catch(error){
                  reject(error);
                }
              });
            }
          }
        },
        action:{
          root: {
            handler: function(req) {
              return this;
            }
          }
        }
      },
      view: {
        root: {
          secure: true
        }
      },
      action: {
        root: {
          secure: true,
          handler: function(req) {
            if (payment.transaction_id !== '') {
              throw new api.payment.Error('submitted',
                'Payment has already been submitted.', [],
                400);
            }
          }
        },
        submit: {
          secure: true,
          handler: function(req, res) {
            var payment = this;

            return (new Promise(function(resolve, reject) {
              try {
                if (payment.transaction_id !== '') {
                  throw new api.payment.Error('submitted',
                    'Payment has already been submitted.', [],
                    400);
                }

                gateway.transaction.sale({
                  amount: payment.amount,
                  paymentMethodNonce: req.body.paymentMethodNonce,
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
            .then(function(result) {

              payment.transaction_id = result.transaction.id;

              return payment.save();
            })
            .then(function(payment){
              return (new Promise(function(resolve, reject) {
                try{
                  gateway.transaction.submitForSettlement(payment.transaction_id, function(error, result) {
                    if (error){
                      return reject(
                        new api.payment.Error('braintree',
                          'payment [0] could not be submitted for settlement.',
                          [payment.transaction_id],
                          500));
                    }

                    return resolve();
                  });
                } catch (error) {
                  reject(error);
                }
              }));
            });
          }
        }
      },
      internal: {

      }
    }
  };
};
