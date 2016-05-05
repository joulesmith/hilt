"use strict";

var Promise = require('bluebird');
var twilio = require('twilio');
var xoauth2 = require('xoauth2');
var crypto = require('crypto');
var crypto_pbkdf2 = Promise.promisify(crypto.pbkdf2);


var phone_regex = /\b[0-9]{10}\b/;

module.exports = function(api){
  var client;

  return {
    phone: {
      settings: {
        accountSid: '',
        authToken: '',
        number: ''
      },
      configure: function(){

        if (!api.phone.settings.accountSid || !api.phone.settings.authToken || !api.phone.settings.number) {
          console.log("Twilio phone client has not been configured.");
          return;
        }

        client = twilio(api.phone.settings.accountSid, api.phone.settings.authToken);
      },
      state: { // this is what will be stored in the database specific to each resource
        independent: { // what can be set directly
          number: String,
          signin: Boolean // should this phone be used as a step in signing in.
        },
        dependent: { // what is set indirectly according to the api
          verified: Boolean,
          verifySalt: String,
          verifyCodeHash: String
        },
        index: { },
      },
      static: {
        view: {

        },
        action:{
          root: {
            handler: function(req) {
              if (!phone_regex.test(this.number)){
                throw new api.phone.Error('invalidphone',
                  'The phone number must be 10 digits with no spaces or puncuation.', [],
                400);
              }

              // this will actually return the default return value
              return Promise.resolve();
            }
          }
        }
      },
      view: {
        root: {
          secure: true
        },
        'verified': {
          parameter: ':code',
          handler: function(req, res) {
            var phone = this;

            res.render('verified', {
              _id: phone._id,
              number: phone.number,
              code: req.params.code
            });

          }
        }
      },
      action: {
        root: {
          secure: true,
          handler: function(req) {

            if (!phone_regex.test(this.number)){
              throw new api.phone.Error('invalidphone',
                'The phone address is not a valid format.', [],
              400);
            }

            this.verified = false;
          }
        },
        'send-code-link': {
          secure: true,
          handler: function(req, res){
            var phone = this;

            phone.verifySalt = crypto.randomBytes(16).toString('hex');
            var code = crypto.randomBytes(16).toString('hex');

            return crypto_pbkdf2(code, phone.verifySalt, 1000, 64, 'sha256')
            .then(function(codeHash) {
              phone.verifyCodeHash = codeHash.toString('hex');

              return phone.save();
            })
            .then(function(phone){
              return phone.sendSms({
                text: 'http://localhost:3000/api/phone/' + phone._id + '/verified/' + code
              });
            });
          }
        },
        verify: {
          secure: false,
          handler: function(req, res) {
            var phone = this;

            if (phone.verified) {
              return {
                verified: true
              };
            }

            return crypto_pbkdf2(req.body.code, phone.verifySalt, 1000, 64, 'sha256')
            .then(function(codeHash) {
              if (phone.verifyCodeHash === codeHash.toString('hex')){
                phone.verified = true;
                return phone.save();
              }

              return phone;
            })
            .then(function(phone) {
              return {
                verified: phone.verified
              };
            });
          }
        }
      },
      internal: {
        sendSms: function(data) {
          var phone = this;

          return new Promise(function(resolve, reject){
            //https://www.twilio.com/blog/2013/03/introducing-the-twilio-module-for-node-js.html
            client.sendSms({
              to: phone.number,
              from: api.phone.settings.number,
              body: data.text
            }, function(error, message) {
              if (error) {
                reject(error);
              }else{
                resolve(message);
              }

              if (!error) {
                console.log('Success! The SID for this SMS message is:');
                console.log(message.sid);
                console.log('Message sent on:');
                console.log(message.dateCreated);

              } else {
                console.log('Oops! There was an error.');
              }
            });
          });
        }
      }
    }
  };
};
