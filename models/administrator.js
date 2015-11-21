var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var ursa = require('ursa');
var braintree = require("braintree");
var xoauth2 = require('xoauth2');

// This stores all the constants needed to perform secure actions
// nothing should be stored that, if it were viewed, would seriously
// compromise the business.
var AdministratorSchema = new mongoose.Schema({
    // only these users should be able to alter any value in this document.
    users : [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],

    // can be used to enable password reset by sending an email with a reset code.
    // keep in mind that email is not encrypted, and so someone (e.g. NSA) could theoretically
    // view the code and reset the password without a user's consent and enter their
    // account.
    enablePasswordReset : {type : Boolean, default : false},

    //
    termsAndConditions : {type : String, default : ''},

    // used to enable requirement to agree to the terms and conditions
    requireAgreement : {type : Boolean, default : false},

    // this is a public RSA key used to encrypt bank account information entered
    // in accounts. This prevents bank account information from being compromised
    // even if the database entries are viewed. The account information is only left
    // un-encrypted in the application layer and never stored. Even better might be
    // to use this key to encrypt on the client side before being sent to the server.
    // the private key is not stored on the server, and is only used by the person
    // authorized to process the bank deposits.
    rsaPublicKeyPEM : {type : String, default : ''},

    // These are the values needed to ininiate a payment using braintree.
    // Since these values can only be used to send money too our account, we cannot
    // lose money if they are observed. A client must authorize their transaction
    // so this information cannot result in an un-authorized transaction from the clients
    // perspective.
    braintree : {
        sandbox : {type : Boolean, default : true},
        merchantId: {type : String, default : ''},
        publicKey: {type : String, default : ''},
        privateKey: {type : String, default : ''},
    },

    // this is needed for making oauth request to google services for whole app
    // these should be setup specific to app domain (with google).
    google : {
        clientId : {type : String, default : ''},
        clientSecret : {type : String, default : ''},
        refreshToken : {type : String, default : ''}
    }
});

// This limits the security to the security of the connection the private key is sent
// over to the administrator. It's better to supply a public key to the server which
// was generated on a secure machine.
AdministratorSchema.methods.generateRSA = function(cb) {

    var key = ursa.generatePrivateKey();
    var rsa_private_key_pem = key.toPrivatePem().toString('ascii');
    this.rsaPublicKeyPEM = key.toPublicPem().toString('ascii');

    this.save(function(err, auth){
        cb(err, {
            rsaPrivateKeyPEM : rsa_private_key_pem
        });
    });
};

// Encrypt important information using the public key, which can only be decrypted
// by an authorized person at a later date (who has the private key).
AdministratorSchema.methods.encryptRSA = function(plaintext, cb) {

    var public_key = ursa.createPublicKey(this.rsaPublicKeyPEM);

    var ciphertext = public_key.encrypt(plaintext, 'utf8', 'base64');

    cb(null, ciphertext)

};

// Generates the client token used by braintree to process a payment
AdministratorSchema.methods.generateBraintreeToken = function(cb) {

    braintree.connect({
        environment: this.braintree.sandbox ? braintree.Environment.Sandbox : null,
        merchantId: this.braintree.merchantId,
        publicKey: this.braintree.publicKey,
        privateKey: this.braintree.privateKey
    }).clientToken.generate({}, function (err, response) {
        cb(err, response.clientToken);
    });
};

// Generate a new secret to use for jwt
// this will invalidate all current tokens, and all users will be forced
// to re-authenticate.
AdministratorSchema.methods.generateJSONWebTokenSecret = function(cb) {

    this.jwt.secret = crypto.randomBytes(16).toString('hex');
    this.jwt.date = Date.now();

    this.save(cb);
};

// create an xoauth2 generator using application data
AdministratorSchema.methods.generateOAuth2 = function(email, accessToken, cb) {
    // from nodemailer docs
    var generator = xoauth2.createXOAuth2Generator({
        user: email,
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        refreshToken: this.refreshToken,
        accessToken: accessToken
    });

    cb(null, generator);
};

mongoose.model('administrator', AdministratorSchema);
