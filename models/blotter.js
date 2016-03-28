"use strict";

/**
 * a piece of blotting paper used to absorb excess ink, to protect a desk top, etc.
 */

var Promise = require('bluebird');
var mongoose = require('mongoose');


module.exports = function(api){
  return {
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
      // no restrictions to access, only uses http gets to base url
      static: {
        view: {
          search: {
            handler: function(req, res) {

              return api.blotter.Model.find({
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
                    throw new api.blotter.Error('noresults',
                      'No blotters found matching search words.', [],
                      404);
                  }
                  return blotter;
                });
            }
          }
        },
        action:{
          root:{}
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
};
