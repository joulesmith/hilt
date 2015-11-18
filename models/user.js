var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var crypto = require('crypto');

var UserSchema = new mongoose.Schema({
    email : String,

    passwordHash: {type : String, default : ''},
    tokenSalt : {type : String, default : ''},
    tokenHash : {type : String, default : ''},
    tokenExpiration : {type : Number, default : 0}, // (ms) unix time

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
 * Generates a token to replace use of password for authentication.
 * @param  {Number}   milliseconds How long this token will be valid.
 * @param  {Function} cb           Callback (error, token)
 */
UserSchema.methods.generateToken = function(milliseconds, cb) {
    var user = this;

    user.tokenSalt = crypto.randomBytes(16).toString('hex');
    user.tokenExpiration = milliseconds + Date.now();
    var secret = crypto.randomBytes(16).toString('hex');

    crypto.pbkdf2(secret, user.tokenSalt, 1000, 64, 'sha256', function(err, key) {
        if (err) {
            return cb(err);
        }

        user.tokenHash = key.toString('hex');

        user.save(function(err, user){
            if (err) {
                return cb(err);
            }

            var token = {
                _id : user._id,
                secret : secret,
                expiration : user.tokenExpiration
            };

            cb(null, token);
        });
    });

};

UserSchema.methods.verifyToken = function(token, cb) {
    var user = this;

    if (token.expiration < user.tokenExpiration) {
        return cb(null, false);
    }

    crypto.pbkdf2(token.secret, user.tokenSalt, 1000, 64, 'sha256', function(err, key) {
        if (err) {
            return cb(err);
        }

        cb(null, key.toString('hex') === user.tokenHash);
    });
}

mongoose.model('user', UserSchema);
