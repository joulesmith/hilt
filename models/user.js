var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var crypto = require('crypto');

var UserSchema = new mongoose.Schema({
    email : String,

    passwordHash: {type : String, default : ''},
    tokenSalt : {type : String, default : ''},
    tokenHash : {type : String, default : ''},

    google : {
        email : {type : String, default : ''},
        accessToken : {type : String, default : ''}
    }
});

UserSchema.methods.generateSecret = function(cb) {

    var that = this;

    if (this.secret_hash !== '') {
        return cb(new Error('secret already generated.'));
    }

    var secret = crypto.randomBytes(16).toString('hex');

    bcrypt.hash(secret, 10, function(err, hash) {
        if (err) {
            return cb(err);
        }

        that.secret_hash = hash;

        that.save(function(err, user){
            cb(err, secret);
        });
    });
};

UserSchema.methods.setPassword = function(new_password, cb) {
    var that = this;

    bcrypt.hash(new_password, 10, function(err, hash) {
        if (err) {
            return cb(err);
        }

        that.passwordHash = hash;

        that.save(cb);
    });


};

UserSchema.methods.verifyPassword = function(password, cb) {

    if (this.passwordHash === '') {
        return cb(new Error('password is not set'));
    }

    bcrypt.compare(password, this.passwordHash, cb);
};

UserSchema.methods.generateToken = function(cb) {
    var that = this;

    this.tokenSalt = crypto.randomBytes(16).toString('hex');
    var token = crypto.randomBytes(16).toString('hex');

    crypto.pbkdf2(token, this.tokenSalt, 1000, 64, 'sha256', function(err, key) {
        if (err) {
            return cb(err);
        }

        that.tokenHash = key.toString('hex');

        that.save(function(err, user){
            if (err) {
                return cb(err);
            }

            cb(null, token);
        });
    });

};

UserSchema.methods.verifyToken = function(token, cb) {
    var that = this;

    crypto.pbkdf2(token, this.tokenSalt, 1000, 64, 'sha256', function(err, key) {
        if (err) {
            return cb(err);
        }

        cb(null, key.toString('hex') === that.tokenHash);
    });
}

mongoose.model('user', UserSchema);
