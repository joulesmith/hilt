"use strict";

var Promise = require('bluebird');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var crypto_pbkdf2 = Promise.promisify(crypto.pbkdf2);

var email_regex = /\b[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+(?:[a-zA-Z]+)\b/;

module.exports = function(api){
  return {
    email: {
      state: { // this is what will be stored in the database specific to each resource
        independent: { // what can be set directly
          address: String,
          signin: Boolean // should this email be used as a step in signing in.
        },
        dependent: { // what is set indirectly according to the api
          verified: Boolean,
          verifySalt: String,
          verifyCodeHash: String
        },
        index: { },
      },
      static: {
        action:{
          root: {
            handler: function(req) {
              if (!email_regex.test(this.address)){
                throw new api.email.Error('invalidemail',
                  'The email address is not a valid format.', [],
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
        }
      },
      action: {
        root: {
          secure: true,
          handler: function(req) {

            if (!email_regex.test(this.address)){
              throw new api.email.Error('invalidemail',
                'The email address is not a valid format.', [],
              400);
            }

            this.verified = false;
          }
        },
        'send-code': {
          secure: true,
          handler: function(req, res){
            var email = this;

            email.verifySalt = crypto.randomBytes(16).toString('hex');
            var code = crypto.randomBytes(16).toString('hex');

            return crypto_pbkdf2(code, email.verifySalt, 1000, 64, 'sha256')
            .then(function(codeHash) {
              email.verifyCodeHash = codeHash.toString('hex');

              return email.save();
            })
            .then(function(email){
              return email.sendMail({
                text: code
              });
            });
          }
        },
        'verify-code': {
          handler: function(req, res) {
            var email = this;

            return crypto_pbkdf2(req.body.code, email.verifySalt, 1000, 64, 'sha256')
            .then(function(codeHash) {
              if (email.verifyCodeHash === codeHash.toString('hex')){
                email.verified = true;
                return email.save();
              }
            });
          }
        }
      },
      internal: {
        sendMail: function(data) {
          var email = this;

          return new Promise(function(resolve, reject){
            var smtpConfig = {
              host: 'smtp.gmail.com',
              port: 465,
              secure: true, // use SSL
              auth: {
                user: '',
                pass: ''
              }
            };

            var transporter = nodemailer.createTransport(smtpConfig);

            data.from = 'carter.dodd@joulesmith.com';
            data.to = email.address;

            transporter.sendMail(data, function(err, info){
              if (err){
                reject(err);
              }else{
                resolve(info);
              }
            });

          });
        }
      }
    }
  };
};
