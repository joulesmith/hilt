"use strict";

var Promise = require('bluebird');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var _ = require('lodash');

var bcrypt_hash = Promise.promisify(bcrypt.hash);
var bcrypt_genSalt = Promise.promisify(bcrypt.genSalt);
var bcrypt_compare = Promise.promisify(bcrypt.compare);
var crypto_pbkdf2 = Promise.promisify(crypto.pbkdf2);

var googleapis = require('googleapis');

module.exports = function(api) {

  /*var oauth2Client = new googleapis.auth.OAuth2(
    '227454360184-kk55m7mdg9blkgnkd7pmuhs3d20kh806.apps.googleusercontent.com',
    'NP53QGYunsiy33xfvF1IeUu5',
    'http://localhost:3000/api/user/google-auth-callback');*/
  var oauth2Client;
  var oauthURL;

  return {
    user: {
      settings: {
        clientId: "Client ID",
        clientSecret: "Client Secret"
      },
      configure: function(settings){
        // TODO: compute from site domain name + uri (not an independent setting)
        var redirectUrl = 'http://localhost:3000/api/user/google-auth-callback';

        if (!settings.clientId || !settings.clientSecret){
          return console.log('Configuration for Google G+ authentication has not been set.');
        }

        oauth2Client = new googleapis.auth.OAuth2(
          settings.clientId,
          settings.clientSecret,
          redirectUrl
        );

        var scopes = [
          'https://www.googleapis.com/auth/plus.me'
        ];

        oauthURL = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: scopes.join(" ") // space delimited string of scopes
        });
      },
      static: {
        view:{
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
                res.render('googleCallback', {
                  error: req.query.error,
                  code: ''
                });
              } else if(req.query.code) {
                res.render('googleCallback', {
                  error: '',
                  code: req.query.code
                });
              }else{
                res.render('googleCallback', {
                  error: '',
                  code: ''
                });
              }
            }
          }
        },
        action: {
          'google-auth-token': {
            handler: function(req, res){

              return new Promise(function(resolve, reject) {
                oauth2Client.getToken(req.body.code, function(err, tokens) {

                  if (err) {
                    return reject(err);
                  }
                  // contains an access_token and optionally a refresh_token.
                  // save them permanently.
                  //
                  oauth2Client.setCredentials(tokens);

                  googleapis.plus('v1').people.get({
                    userId: 'me',
                    auth: oauth2Client
                  }, function(err, person) {

                    if (err) {
                      return reject(err);
                    }

                    api.user.collection.findOne({
                      'signin.google': person.id
                    }).exec()
                    .then(function(user) {

                      if (!user) {
                        return api.user.create()
                        .then(function(user){
                          user.signin = {
                            'username' : '',
                            'guest' : false,
                            'google': person.id
                          };

                          return user.save();
                        })
                        .then(function(user){
                          return user.generateTokenFromOauthToken(tokens.access_token);
                        })
                      }

                      return user.generateTokenFromOauthToken(tokens.access_token);
                    })
                    .then(function(token) {
                      resolve({
                        token: token
                      });
                    })
                    .catch(function(error) {
                      reject(error);
                    });
                  });

                });
              });
            }
          }
        }
      },
      action: {
        'signin-google' : {
          handler: function(req, res) {
            var that = this;

            return new Promise(function(resolve, reject) {

              oauth2Client.getToken(req.body.code, function(err, tokens) {
                if (err) {
                  return reject(err);
                }
                // contains an access_token and optionally a refresh_token.
                // save them permanently.
                //
                oauth2Client.setCredentials(tokens);

                googleapis.plus('v1').people.get({
                  userId: 'me',
                  auth: oauth2Client
                }, function(err, person) {

                  if (err) {
                    return reject(err);
                  }

                  api.user.collection.findOne({
                    'signin.google': person.id
                  }).exec()
                  .then(function(user) {

                    if (user && !req.user._id.equals(user._id)) {
                      throw new api.user.Error('inuse',
                        'The google account is already in use by another user.', [],
                        400);
                    }

                    that.signin = {
                      'username' : '',
                      'google': person.id,
                      'guest' : false
                    };

                    return that.generateTokenFromOauthToken(tokens.access_token);
                  })
                  .then(function(token) {
                    resolve({
                      token: token
                    });
                  })
                  .catch(reject);
                });
              });
            });
          }
        }
      },
      // only accessible on the server
      internal: {
        generateTokenFromOauthToken: function(oauthToken) {
          var user = this;
          user.tokenSalt = crypto.randomBytes(16).toString('hex');
          var secret = oauthToken;

          return crypto_pbkdf2(secret, user.tokenSalt, 1000, 64, 'sha256')
            .then(function(tokenHash) {
              user.tokenHash = tokenHash.toString('hex');

              return user.save();
            })
            .then(function(user) {
              var token = {
                _id: user._id,
                secret: secret
              };

              // this enocding is for use in header authorization.
              token.base64 = (new Buffer(JSON.stringify(token), 'utf8')).toString('base64');

              return token;
            });
        }
      }
    }
  };
};
