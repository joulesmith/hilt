var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var Promise = require('bluebird');
var _ = require('lodash');

var bcrypt_hash = Promise.promisify(bcrypt.hash);
var bcrypt_genSalt = Promise.promisify(bcrypt.genSalt);
var bcrypt_compare = Promise.promisify(bcrypt.compare);
var crypto_pbkdf2 = Promise.promisify(crypto.pbkdf2);

var UserSchema = new mongoose.Schema({
    created: Number,
    locale: {type: String, default: 'en-US'},

    passwordHash: {type : String, default : ''},
    secretSalt : {type : String, default : ''},
    tokenSalt : {type : String, default : ''},
    tokenHash : {type : String, default : ''},

    signin: {
      guest: {type: Boolean, default: false},
      username: {type : String, default : ''},
      google: {type : String, default : ''},
      facebook: {type : String, default : ''}
    },
    // email to contact the user about things
    email: { type: mongoose.Schema.Types.ObjectId, ref: 'email' },

    // store credentials to use google services for this user
    groups : [String],
    accessRecords : mongoose.Schema.Types.Mixed
});

/**
 * Set a password
 * @param  {String}   new_password New password to use
 */
UserSchema.methods.setPassword = function(new_password) {
  var user = this;

  return bcrypt_hash(new_password, 10)
    .then(function(hash) {

      user.passwordHash = hash;

      // reset tokens because password changed
      return user.resetTokens(new_password);
    });
};

/**
 * Resets the salt and hash used to generate/verify tokens
 * @param  {[type]}   milliseconds How long this secret will be valid.
 */
UserSchema.methods.resetTokens = function(password) {
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
};

/**
 * Verify a given password against the hash in the database
 * @param  {String}   password plaintext password to validate against stored hash
 */
UserSchema.methods.verifyPassword = function(password) {
  var user = this;

  return (new Promise(function(resolve, reject) {
      try {

        if (user.passwordHash === '') {
          throw new Error('password is not set');
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

};

/**
 * Generates a token to replace use of password for authentication.
 * @param  {Number}   milliseconds How long this token will be valid.
 */
UserSchema.methods.generateToken = function(password) {
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

};

UserSchema.methods.generateGuestToken = function() {
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
};

UserSchema.methods.generateTokenFromOauthToken = function(oauthToken) {
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
};

UserSchema.methods.verifyToken = function(token) {
  var user = this;

  return crypto_pbkdf2(token.secret, user.tokenSalt, 1000, 64, 'sha256')
    .then(function(tokenHash) {
      if (tokenHash.toString('hex') === user.tokenHash) {
        return user;
      }

      return null;
    });
}

UserSchema.methods.accessGranted = function(model, actions, resource) {
  var user = this;
  var resource_id = '' + resource._id;

  if (!user.accessRecords) {
    user.accessRecords = {};
  }

  if (!user.accessRecords[model]) {
    user.accessRecords[model] = {
      id: [],
      actions: []
    };
  }

  var recordIndex = _.sortedIndex(user.accessRecords[model].id, resource_id);


  if (user.accessRecords[model].id[recordIndex] !== resource_id) {
    user.accessRecords[model].id.splice(recordIndex, 0, resource_id);
    user.accessRecords[model].actions.splice(recordIndex, 0, []);
  }

  user.accessRecords[model].actions[recordIndex] = _.union(user.accessRecords[model].actions[recordIndex], actions);

  user.markModified('accessRecords');

  return user.save();
}

UserSchema.methods.accessRevoked = function(model, actions, resource) {
  var user = this;
  var resource_id = '' + resource._id;

  if (user.accessRecords[model]) {
    var recordIndex = _.sortedIndex(user.accessRecords[model].id, resource_id);

    if (recordIndex !== -1) {

      user.accessRecords[model].actions[recordIndex] = _.without(user.accessRecords[model].actions[recordIndex], actions);

      if (user.accessRecords[model].actions[recordIndex].length === 0) {
        // if no actions can be be performed, remove resource
        user.accessRecords[model].id.splice(recordIndex, 1);
        user.accessRecords[model].actions.splice(recordIndex, 1);

        if (user.accessRecords[model].id.length === 0) {
          // if there are no more resources of this type, then remove Model
          delete user.accessRecords[model];
        }
      }
    }
  }

  user.markModified('accessRecords');

  return user.save();
}

UserSchema.methods.addGroup = function(group) {
  var user = this;
  var group_id = group._id.toString();

  var index = _.sortedIndex(user.groups, group_id);

  user.groups.slice(index, 0, group_id);

  return user.save();
};

UserSchema.methods.removeGroup = function(group) {
  var user = this;
  var group_id = group._id.toString();

  var index = _.indexOf(user.groups, group_id, true);

  user.groups.slice(index, 1);

  return user.save();
};

mongoose.model('user', UserSchema);
