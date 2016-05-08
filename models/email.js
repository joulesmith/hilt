"use strict";

var Promise = require('bluebird');

var xoauth2 = require('xoauth2');
var crypto = require('crypto');
var crypto_pbkdf2 = Promise.promisify(crypto.pbkdf2);
var googleapis = require('googleapis');

var email_regex = /\b[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+(?:[a-zA-Z]+)\b/;

module.exports = function(api){
  var oauth2Client;
  var oauthURL;
  var transporter;

  return {
    email: {
      settings: {
        gmail: null
      },
      configure: function(){
        var redirectUrl = 'http://localhost:3000/api/email/google-auth-callback';

        if (!api.user.settings.clientId || !api.user.settings.clientSecret){
          return console.log('Configuration for Google G+ authentication has not been set.');
        }

        oauth2Client = new googleapis.auth.OAuth2(
          api.user.settings.clientId,
          api.user.settings.clientSecret,
          redirectUrl
        );

        var scopes = [
          'https://mail.google.com/'
        ];

        oauthURL = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: 'https://mail.google.com/' // space delimited string of scopes
        });

        if (!api.email.settings.gmail){
          return console.log('Configuration for sending email using google gmail is not set.');
        }

        oauth2Client.setCredentials(api.email.settings.gmail.tokens);
      },
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
        view: {
          'google-auth-url' : {
            handler: function() {
              return {
                url: oauthURL
              };
            }
          },
          'google-auth-callback' : {
            handler: function(req, res) {
              if (req.query.error) {
                res.render('oauthCallback', {
                  error: req.query.error,
                  code: ''
                });
              } else if(req.query.code) {
                res.render('oauthCallback', {
                  error: '',
                  code: req.query.code
                });
              }else{
                res.render('oauthCallback', {
                  error: '',
                  code: ''
                });
              }
            }
          }
        },
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
          },
          'google-auth-token': {
            handler: function(req, res) {

              return new Promise(function(resolve, reject) {
                try{
                  oauth2Client.getToken(req.body.code, function(err, tokens) {

                    if (err) {
                      return reject(err);
                    }

                    resolve({
                      tokens: tokens
                    });

                  });
                }catch(error){
                  reject(error);
                }
              });
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
            var email = this;

            res.render('verified', {
              _id: email._id,
              address: email.address,
              code: req.params.code
            });

          }
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
                text: 'http://localhost:3000/api/email/' + email._id + '/verified/' + code
              });
            });
          }
        },
        verify: {
          secure: false,
          handler: function(req, res) {
            var email = this;

            if (email.verified) {
              return {
                verified: true
              };
            }

            return crypto_pbkdf2(req.body.code, email.verifySalt, 1000, 64, 'sha256')
            .then(function(codeHash) {
              if (email.verifyCodeHash === codeHash.toString('hex')){
                email.verified = true;
                return email.save();
              }

              return email;
            })
            .then(function(email) {
              return {
                verified: email.verified
              };
            });
          }
        }
      },
      internal: {
        sendMail: function(data) {
          var email = this;

          return new Promise(function(resolve, reject){
            try{
              //http://stackoverflow.com/questions/34546142/gmail-api-for-sending-mails-in-node-js
              //
              var str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
                "MIME-Version: 1.0\n",
                "Content-Transfer-Encoding: 7bit\n",
                "to: ", email.address, "\n",
                "from: ", 'test.test@gmail.com', "\n",
                "subject: ", 'test', "\n\n",
                data.text
              ].join('');

              var encodedMail = new Buffer(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');

              googleapis.gmail('v1').users.messages.send({
                auth: oauth2Client,
                userId: 'me',
                resource: {
                  raw: encodedMail
                }
              }, function(err, res) {
                err ? reject(err) : resolve(res);
              });
            }catch(error){
              reject(error);
            }
          });
        }
      }
    }
  };
};
