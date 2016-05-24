"use strict";

var Promise = require('bluebird');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var _ = require('lodash');

var bcrypt_hash = Promise.promisify(bcrypt.hash);
var bcrypt_genSalt = Promise.promisify(bcrypt.genSalt);
var bcrypt_compare = Promise.promisify(bcrypt.compare);
var crypto_pbkdf2 = Promise.promisify(crypto.pbkdf2);

var zxcvbn = require('zxcvbn');

var username_regex = /^[a-z0-9._-]{3,20}$/;


module.exports = function(api) {

  return {
    user: {
      state: { // this is what will be stored in the database specific to each resource
        independent: { // what can be set directly
          locale: {
            type: String,
            default: 'en-US'
          }
        },
        dependent: { // what is set indirectly according to the api
          passwordHash: {
            type: String,
            default: ''
          },
          secretSalt: {
            type: String,
            default: ''
          },
          tokenSalt: {
            type: String,
            default: ''
          },
          tokenHash: {
            type: String,
            default: ''
          },
          signin: {
            guest: {
              type: Boolean,
              default: false
            },
            username: {
              type: String,
              default: ''
            },
            google: {
              type: String,
              default: ''
            }
          },
          // email to contact the user about things
          email: {
            type: api.types.ObjectId,
            ref: 'email'
          },

          // store credentials to use google services for this user
          groups: [String],
          accessRecords: {
            type: api.types.Mixed,
            default: {}
          }
        },
        index: null, // used for text searches
      },
      static: {
        //
        // Static Views
        //
        view:{
          'registered' : {
            parameter: ':username(*)',
            handler: function(req) {

              if (!req.params.username) {
                return {
                  registered: false
                };
              }

              return api.user.collection.findOne({
                "signin.username": '' + req.params.username
              }).exec()
              .then(function(user) {
                if (!user) {
                  return {
                    registered: false
                  };
                } else {
                  return {
                    registered: true
                  };
                }
              });
            }
          }
        },
        //
        // Static Actions
        //
        action: {
          // creation action
          root: {
            creatorAccess: ['root'],
            handler: function(req, res) {

              if (!req.body.username) {
                throw new api.user.Error('nousername',
                  'A username must be supplied to register a new user.', [],
                  400);
              }

              if (!username_regex.test(req.body.username)) {
                throw new api.user.Error('invalidusername',
                  'A username must be between 3 and 20 characters, letters and numbers.', [],
                  400);
              }

              if (!req.body.password || req.body.password === '') {
                throw new api.user.Error('nopassword',
                  'A password must be supplied to register a new user.', [],
                  400);
              }

              var password_result = zxcvbn(req.body.password);

              if (password_result.score < 3) {
                throw new api.user.Error('insecurepassword',
                  'The password supplied scored [0]/4 for security. A minimum of 3/4 is required.', [password_result.score],
                  400);
              }

              var username = '' + req.body.username;
              var password = '' + req.body.password;
              var locale = '' + req.body.locale || 'en-US';

              return api.user.collection.findOne({
                  "signin.username": username
                })
                .then(function(user) {
                  if (user) {
                    throw new api.user.Error('inuse',
                      'The username [0] is already in use by another user.', [username],
                      400);
                  }
                })
                .then(function() {
                  return api.user.create({
                    locale: locale
                  });
                })
                .then(function(newuser){
                  newuser.signin = {
                    username: username
                  };

                  return newuser.setPassword(password);
                })
                .then(function(user){

                  return user.accessGranted([
                    {model: 'user', actions: ['root']},
                    {model: 'group', actions: ['root']},
                    {model: 'email', actions: ['root']},
                    {model: 'phone', actions: ['root']},
                    {model: 'file', actions: ['root']},
                    {model: 'payment', actions: ['root']},
                    {model: 'blotter', actions: ['root']},
                  ]);
                })
                .then(function(user) {
                  return {
                    _id: user._id,
                    created: user.created,
                    signin: user.signin,
                    locale: user.locale,
                    email: user.email,
                    groups: user.groups
                  };
                });
            }
          },
          'guest': {
            secure: true,
            handler: function(){
              return api.user.create()
              .then(function(user){
                user.signin = {
                  guest: true
                };

                return user.generateGuestToken()
                .then(function(token) {
                  return {
                    token: token
                  };
                });
              });
            }
          },
          'merge': {
            secure: true,
            handler: function(req, res){
              var fromUser = null;
              var toUser = null;

              return api.user.collection.findById(req.body.fromToken._id).exec()
                .then(function(user) {
                  if (!user) {
                    throw new api.user.Error('nouser',
                      'From user not found.', [],
                      404);
                  }

                  if (!user.signin.guest) {
                    throw new api.user.Error('notguest',
                      'Only a guest account may be merged with another account.', [],
                      403);
                  }

                  return user.verifyToken(req.body.fromToken);
                }).then(function(user) {
                  fromUser = user;
                  return api.user.collection.findById(req.body.toToken._id).exec()
                })
                .then(function(user) {
                  if (!user) {
                    throw new api.user.Error('nouser',
                      'To user not found.', [],
                      404);
                  }

                  return user.verifyToken(req.body.toToken);
                }).then(function(user) {
                  toUser = user;

                  if (!fromUser || !toUser) {
                    throw new api.user.Error('unauthorized',
                      'Merge failed because it is not authorized.', [],
                      401);
                  }

                  // merge by changing all ownerships and/or references?
                  //
                  if (fromUser.accessRecords) {

                    var accessChanges = [];

                    for (var model in fromUser.accessRecords) {
                      fromUser.accessRecords[model].id.forEach(function(_id, fromIndex) {
                        var actions = fromUser.accessRecords[model].actions[fromIndex];
                        accessChanges.push({
                          model: model,
                          actions: actions,
                          instance: {_id: _id}
                        });
                      });
                    }

                    return fromUser.accessRevoked(accessChanges)
                    .then(function(){
                      return toUser.accessGranted(accessChanges);
                    })
                    .then(function() {
                      return fromUser.deleteEvent();
                    });
                  } else {
                    return fromUser.deleteEvent();
                  }
                })
                .then(function() {
                  return {};
                });
            }
          },
          'token': {
            handler: function(req, res) {
              if (!req.user || !req.body.password) {
                // TODO: this message doesn't seem right here. it shouldn't know why user is not authenticated
                throw new api.user.Error('nouser',
                  'The username and password combination provided are not valid.', [],
                  401);
              }

              return req.user.generateToken('' + req.body.password)
                .then(function(token) {
                  return {
                    token: token
                  };
                })
            }
          },
          'token-reset' :{
            handler : function() {
              if (!req.user || !req.body.password) {
                throw new api.user.Error('nouser',
                  'The username and password combination provided are not valid.', [],
                  401);
              }

              return req.user.resetTokens('' + req.body.password)
                .then(function(user) {
                  return {
                    _id: user._id
                  };
                });
            }
          }
        }
      },
      //
      // Views
      //
      view: {
        secure: true,
        root: {
          handler: function() {
            return {
              _id: this._id,
              signin: this.signin,
              locale: this.locale,
              email: this.email,
              groups: this.groups
            };
          }
        },
        'records':{
          parameter: ':model(*)',
          handler: function(req){

            if (req.params.model) {
              // return only the specific model
              if (this.accessRecords[req.params.model]) {
                return this.accessRecords[req.params.model];
              }

              return {id: [], actions: []};
            }

            // return everything
            return  this.accessRecords;
          }
        }
      },
      //
      // Actions
      //
      action: {
        secure: true,
        root: {
          handler: function(req) {

          }
        },
        'signin-username' : {
          handler: function(req, res) {

            if (!req.body.username || !username_regex.test(req.body.username)) {
              throw new api.user.Error('nousername',
                'A username must be supplied.', [],
                400);
            }

            if (!username_regex.test(req.body.username)) {
              throw new api.user.Error('invalidusername',
                'A username must be between 3 and 20 characters, letters and numbers.', [],
                400);
            }

            if (!req.body.password || req.body.password === '') {
              throw new api.user.Error('nopassword',
                'A password must be supplied.', [],
                400);
            }

            var password_result = zxcvbn(req.body.password);

            if (password_result.score < 3) {
              throw new api.user.Error('insecurepassword',
                'The password supplied scored [0]/4 for security. A minimum of 3/4 is required.', [password_result.score],
                400);
            }

            var username = '' + req.body.username;
            var password = '' + req.body.password;
            var that = this;

            if (this.signin.username === username) {
              // only changing the password
              return this.setPassword(password)
              .then(function(user) {
                return user.generateToken(password);
              })
              .then(function(token) {
                return {
                  token: token
                };
              });
            } else {
              // new username. need to make sure its not already used.
              return api.user.collection.findOne({
                "signin.username": username
              })
              .then(function(user) {
                if (user) {
                  throw new api.user.Error('inuse',
                    'The username [0] is already in use by another user.', [username],
                    400);
                }
              })
              .then(function() {

                that.signin = {
                  username: username,
                  guest: false,
                  google: ''
                };

                return that.setPassword(password);
              })
              .then(function(user) {
                return user.generateToken(password);
              })
              .then(function(token) {
                return {
                  token: token
                };
              });
            }
          }
        }
      },
      // only accessible on the server
      internal: {
        setPassword: function(new_password) {
          var user = this;

          return bcrypt_hash(new_password, 10)
            .then(function(hash) {

              user.passwordHash = hash;

              // reset tokens because password changed
              return user.resetTokens(new_password);
            });
        },
        resetTokens: function(password) {
          var user = this;

          // the tokens valididy are limited by a secret which can be changed any time,
          // and by a time limit even on otherwise valid secrets.
          user.tokenSalt = crypto.randomBytes(16).toString('hex');

          // this salt is to make sure the password hash cannot be used to generate a secret without the password
          return bcrypt_genSalt(10)
          .then(function(secretSalt) {

            user.secretSalt = secretSalt;

            // this hash is to make cracking the password from the secret harder, although
            // the secret should neven be seen, but just in case. it's slow but only needed
            // when creating a token, not verifying. This is so all tokens are the same (given the salt), and
            // can only be generated if the user knows their password
            return bcrypt_hash(password, secretSalt);
          })
          .then(function(secret) {

            // this is to ensure the token value in the database cannot be used to generate a secret
            // a faster hash is used for verification only.
            return crypto_pbkdf2(secret, user.tokenSalt, 1000, 64, 'sha256');
          })
          .then(function(tokenHash) {
            user.tokenHash = tokenHash.toString('hex');

            return user.save();
          });
        },
        verifyPassword: function(password) {
          var user = this;

          return (new Promise(function(resolve, reject) {
            try {

              if (user.passwordHash === '') {
                throw new api.user.Error('nopassword',
                  'The account cannot be authenticated with a password.', [],
                  403);
              }

              resolve();
            } catch (e) {
              reject(e);
            }
          }))
          .then(function() {
            return bcrypt_compare(password, user.passwordHash);
          })
          .then(function(valid) {
            if (valid) {
              return user;
            }

            return null;
          });

        },
        generateToken: function(password) {
          var user = this;

          return bcrypt_hash(password, user.secretSalt)
          .then(function(secret) {
            var token = {
              _id: user._id,
              secret: secret
            };

            // this enocding is for use in header authorization.
            token.base64 = (new Buffer(JSON.stringify(token), 'utf8')).toString('base64');

            return token;
          });

        },
        generateGuestToken: function() {
          var guest = this;
          guest.tokenSalt = crypto.randomBytes(16).toString('hex');
          var secret = crypto.randomBytes(16).toString('hex');

          return crypto_pbkdf2(secret, guest.tokenSalt, 1000, 64, 'sha256')
          .then(function(tokenHash) {
            guest.tokenHash = tokenHash.toString('hex');

            return guest.save();
          })
          .then(function(guest) {
            var token = {
              _id: guest._id,
              secret: secret
            };

            // this enocding is for use in header authorization.
            token.base64 = (new Buffer(JSON.stringify(token), 'utf8')).toString('base64');

            return token;
          });
        },
        verifyToken: function(token) {
          var user = this;

          return crypto_pbkdf2(token.secret, user.tokenSalt, 1000, 64, 'sha256')
          .then(function(tokenHash) {
            if (tokenHash.toString('hex') === user.tokenHash) {
              return user;
            }

            return null;
          });
        },
        accessGranted: function(input) {
          var arr = Array.isArray(input) ? input : [input];
          var user = this;

          if (!user.accessRecords) {
            user.accessRecords = {};
          }

          arr.forEach(function(granted){

            if (!user.accessRecords[granted.model]) {
              user.accessRecords[granted.model] = {
                static: [],
                id: [],
                actions: []
              };
            }

            var record = user.accessRecords[granted.model];

            if (granted.instance) {

              var resource_id = '' + granted.instance._id;

              var recordIndex = _.sortedIndex(record.id, resource_id);


              if (record.id[recordIndex] !== resource_id) {
                record.id.splice(recordIndex, 0, resource_id);
                record.actions.splice(recordIndex, 0, []);
              }

              // if no actions were supplied, grant root action
              record.actions[recordIndex] = _.union(record.actions[recordIndex], granted.actions || ['root']);
            }else{
              // if no actions were supplied, grant root action
              record.static = _.union(record.static, granted.actions || ['root']);
            }
          });

          user.markModified('accessRecords');

          return user.editEvent();
        },
        testAccess: function(model, action, resource) {
          var user = this;

          if (!user.accessRecords || !user.accessRecords[model]) {
            return false;
          }

          var record = user.accessRecords[model];

          if (resource) {

            var resource_id = '' + resource._id;

            var recordIndex = _.indexOf(record.id, resource_id, true);

            if (recordIndex === -1) {
              return false;
            }

            if (_.contains(record.actions[recordIndex], action)){
              return true;
            }
          }else{
            if (_.contains(record.static, action)){
              return true;
            }
          }

          if (action === 'root') {
            // if root is not authorized then out of luck
            return false;
          } else {
            // as a last resort, any user able to be root can do also anything else
            return user.testAccess(model, 'root', resource);
          }
        },
        accessRevoked: function(input) {
          var arr = Array.isArray(input) ? input : [input];
          var user = this;

          arr.forEach(function(granted){
            if (user.accessRecords[granted.model]) {
              var record = user.accessRecords[granted.model];
              if (granted.instance) {
                var resource_id = '' + granted.instance._id;

                var recordIndex = _.indexOf(record.id, resource_id, true);

                if (recordIndex !== -1) {

                  if (granted.actions){
                    granted.actions.forEach(function(action){
                      record.actions[recordIndex] = _.without(record.actions[recordIndex], action);
                    });
                  }else{
                    // if no actions were supplied, remove all actions
                    record.actions[recordIndex] = [];
                  }

                  if (record.actions[recordIndex].length === 0) {
                    // if no actions can be be performed, remove resource
                    record.id.splice(recordIndex, 1);
                    record.actions.splice(recordIndex, 1);
                  }
                }
              }else{
                if (granted.actions) {
                  granted.actions.forEach(function(action){
                    record.static = _.without(record.static, action);
                  });
                }else{
                  // if no actions were supplied, remove all actions
                  record.static = [];
                }

              }

            }
          });

          user.markModified('accessRecords');

          return user.editEvent();
        },
        addGroup: function(group) {
          var user = this;
          var group_id = group._id.toString();

          var index = _.sortedIndex(user.groups, group_id);

          user.groups.slice(index, 0, group_id);

          return user.editEvent();
        },
        removeGroup: function(group) {
          var user = this;
          var group_id = group._id.toString();

          var index = _.indexOf(user.groups, group_id, true);

          user.groups.slice(index, 1);

          return user.editEvent();
        },
      }
    }
  };
};
