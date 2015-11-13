var mongoose = require('mongoose');
var crypto = require('crypto');

var UserSchema = new mongoose.Schema({
    username: {type: String, lowercase: true, unique: true},

    email : String,

    reset_hash: String,
    password_hash: String,

    public_salt: String,
    private_salt: String,
});

UserSchema.methods.resetSalt = function(){
    this.secret_hash = "";
    this.password_hash = "";

    this.public_salt = crypto.randomBytes(16).toString('hex');
    this.private_salt = crypto.randomBytes(16).toString('hex');

};

UserSchema.methods.generateReset = function(){
    var secret = crypto.randomBytes(16).toString('hex');

    this.reset_hash = crypto.pbkdf2Sync(secret, this.private_salt, 1000, 64).toString('hex');

    return secret;
};

UserSchema.methods.verifyReset = function(secret){
    if (this.secret_hash === '') {
        return false;
    }

    var secret_hash = crypto.pbkdf2Sync(secret, this.private_salt, 1000, 64).toString('hex');

    return this.secret_hash === secret_hash;
};

UserSchema.methods.setPassword = function(password) {
    this.password_hash = crypto.pbkdf2Sync(password, this.private_salt, 1000, 64).toString('hex');
};

UserSchema.methods.verifyPassword = function(password) {

    if (this.password_hash === '') {
        return false;
    }

    return this.password_hash === crypto.pbkdf2Sync(password, this.private_salt, 1000, 64).toString('hex');
};


mongoose.model('broadsword_user', UserSchema);
