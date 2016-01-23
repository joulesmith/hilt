"use strict";


var apimodelfactory = require('./apifactory');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
var error = require('../error');
var Promise = require('bluebird');
var config = require('../config');
var mongoose = require('mongoose');
var crypto = require('crypto');

var crypto_pbkdf2 = Promise.promisify(crypto.pbkdf2);

var ModelError = error('routes.api.email');

module.exports = {
  email: {
    state: { // this is what will be stored in the database specific to each resource
      independent: { // what can be set directly
        email: String
      },
      dependent: { // what is set indirectly according to the api
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
      },
      index: { verifiedBy: 1 },
    },
    create: {
      creatorAccess: ['root'],
      handler: function(req, res) {

        return this.save();
      }
    },
    get: {
      secure: true
    },
    update: {
      secure: true,
      handler: function(req, res) {
        throw new ModelError('updatenotallowed',
          'An email cannot be changed directly. Create a new email instead.', [],
          405);
      }
    },
    static: {
    },
    safe: {},
    unsafe: {

    },
    // only accessible on the server
    internal: {}
  }
};
