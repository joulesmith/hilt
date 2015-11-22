var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var crypto = require('crypto');

var UserSchema = new mongoose.Schema({
    email : String,

    passwordHash: {type : String, default : ''},
    secretSalt : {type : String, default : ''},
    tokenSalt : {type : String, default : ''},
    tokenHash : {type : String, default : ''},
    expiration : {type : Number, default : 0}, // (ms) unix time

    // store credentials to use google services for this user
    google : {
        email : {type : String, default : ''},
        accessToken : {type : String, default : ''}
    }
});

/**
 * Set a password
 * @param  {String}   new_password New password to use
 * @param  {Function} cb           Callback(error, user)
 */
UserSchema.methods.setPassword = function(new_password, cb) {
    var user = this;

    bcrypt.hash(new_password, 10, function(err, hash) {
        if (err) {
            return cb(err);
        }

        user.passwordHash = hash;

        user.save(cb);
    });


};

/**
 * Verify a given password against the hash in the database
 * @param  {String}   password plaintext password to validate against stored hash
 * @param  {Function} cb       Callback (error, valid)
 */
UserSchema.methods.verifyPassword = function(password, cb) {

    if (this.passwordHash === '') {
        return cb(new Error('password is not set'));
    }

    bcrypt.compare(password, this.passwordHash, cb);
};

/**
 * Resets the salt and hash used to generate/verify tokens
 * @param  {[type]}   milliseconds How long this secret will be valid.
 * @param  {Function} cb           [description]
 * @return {[type]}                [description]
 */
UserSchema.methods.resetTokens = function(password, milliseconds, cb) {
    var user = this;
    // the tokens valididy are limited by a secret which can be changed,
    // and by a time limit even on otherwise valid secrets.
    user.secretSalt = crypto.randomBytes(16).toString('hex');
    user.tokenSalt = crypto.randomBytes(16).toString('hex');
    user.expiration = milliseconds + Date.now();

    // this has is to make sure the password hash cannot be used to generate a secret without the password
    crypto.pbkdf2(password, user.secretSalt, 1000, 64, 'sha256', function(err, pwhash) {
        if (err) {
            return cb(err);
        }

        // this hash is to make cracking the password from the secret harder, although
        // the secret should neven be seen, but just in case. it's slow but only needed
        // when creating a token
        bcrypt.hash(pwhash.toString('hex'), 10, function(err, secret) {
            if (err) {
                return cb(err);
            }

            // this is to ensure the token value in the database cannot be used to generate a secret
            crypto.pbkdf2(secret, user.tokenSalt, 1000, 64, 'sha256', function(err, tokenHash) {
                if (err) {
                    return cb(err);
                }

                user.tokenHash = tokenHash.toString('hex');

                user.save(cb);
            });
        });
    });
};

/**
 * Generates a token to replace use of password for authentication.
 * @param  {Number}   milliseconds How long this token will be valid.
 * @param  {Function} cb           Callback (error, token)
 */
UserSchema.methods.generateToken = function(password, cb) {
    var user = this;

    // this has is to make sure the password hash cannot be used to generate a secret without the password
    crypto.pbkdf2(password, user.secretSalt, 1000, 64, 'sha256', function(err, pwhash) {
        if (err) {
            return cb(err);
        }

        // this hash is to make cracking the password from the secret harder, although
        // the secret should neven be seen, but just in case. it's slow but only needed
        // when creating a token
        bcrypt.hash(pwhash.toString('hex'), 10, function(err, secret) {
            if (err) {
                return cb(err);
            }

            var token = {
                _id : user._id,
                secret : secret
            };

            token.base64 = (new Buffer(JSON.stringify(token), 'utf8')).toString('base64');
            token.expiration = user.expiration;

            cb(null, token);
        });
    });

};

UserSchema.methods.verifyToken = function(token, cb) {
    var user = this;

    if (Date.now() > user.expiration) {
        return cb(null, false);
    }

    // this is to ensure the token value in the database cannot be used to generate a secret
    crypto.pbkdf2(token.secret, user.tokenSalt, 1000, 64, 'sha256', function(err, tokenHash) {
        if (err) {
            return cb(err);
        }

        cb(null, tokenHash.toString('hex') === user.tokenHash);
    });
}

mongoose.model('user', UserSchema);
