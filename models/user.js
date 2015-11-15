var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var crypto = require('crypto');

var UserSchema = new mongoose.Schema({
    username: {type: String, lowercase: true, unique: true},

    email : String,

    secret_hash: {type : String, default : ''},
    password_hash: {type : String, default : ''}
});

UserSchema.methods.generateSecret = function(cb) {

    var that = this;

    if (this.secret_hash !== '') {
        return cb(new Error('secret already generated.'));
    }

    var secret = crypto.randomBytes(16).toString('hex');

    bcrypt.hash(secret, 10, function(err, hash) {
        if (err) return cb(err);

        that.secret_hash = hash;

        that.save(function(err, user){
            cb(err, secret);
        });
    });
};

UserSchema.methods.setPassword = function(secret, password, cb) {
    var that = this;

    if (this.secret_hash === '') {
        return cb(new Error('cannot set password without a secret.'));
    }

    bcrypt.compare(secret, this.secret_hash, function(err, valid_secret) {
        if (err) return cb(err);

        if (!valid_secret) {
            return cb(new Error('invalid secret. password was not set.'));
        }

        bcrypt.hash(password, 10, function(err, hash) {
            if (err) return cb(err);

            that.secret_hash = '';
            that.password_hash = hash;

            that.save(cb);
        });
    });
};

UserSchema.methods.verifyPassword = function(password, cb) {

    if (this.password_hash === '') {
        return cb(new Error('password is not set'));
    }

    bcrypt.compare(password, this.password_hash, cb);
};


mongoose.model('broadsword_user', UserSchema);
