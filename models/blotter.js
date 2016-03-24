"use strict";

/**
 * 1715, "to represent in profile," from profile (n.) or Italian profilare. Meaning "to summarize a person in writing" is from 1948
 */

var apimodelfactory = require('./apifactory');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
var error = require('../error');
var Promise = require('bluebird');
var mongoose = require('mongoose');

var ModelError = error('routes.api.blotter');


module.exports = {
  blotter: {
    state: {
      independent: {
        name: {
          type: String,
          default: ''
        },
        main: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        },
        // current key value when adding new elements so that they can be tracked
        key: {
          type: Number,
          default: 0
        },
        words: String,
        files: []
      },
      dependent: {},
      index: {
        name: 'text',
        words: 'text'
      }, // used for text searches
    },
    create: null,
    // no restrictions to access, only uses http gets to base url
    static: {
      search: {
        handler: function(req, res) {

          return mongoose.model('blotter')
            .find({
                $text: {
                  $search: '' + req.query.words
                }
              }, {
                _id: 1,
                name: 1,
                score: {
                  $meta: "textScore"
                }
              } // don't return whole document since anyone can access this
            )
            .sort({
              score: {
                $meta: 'textScore'
              }
            })
            .exec()
            .then(function(blotter) {
              if (!blotter) {
                throw new ModelError('noresults',
                  'No blotters found matching search words.', [],
                  404);
              }
              return blotter;
            });
        }
      }
    },
    view: {
      // GET: /api/model/id
      root: {
        secure: true
      },
      // GET: /api/model/id/primary
      primary: {
        secure: false,
        handler: function() {
          return {
            _id: this._id,
            name: this.name,
            main: this.main
          };
        }
      }
    },
    action: {
      // POST: /api/model/id
      root: {
        secure: true,
        handler: function(req) {
        }
      },
      // POST: /api/model/id/cite
      cite: {
        secure: false,
        handler: function(req) {

        }
      }
    },
    // only accessible on the server
    internal: {}
  }
};
