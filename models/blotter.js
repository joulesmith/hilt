"use strict";

/**
 * a piece of blotting paper used to absorb excess ink, to protect a desk top, etc.
 */

var Promise = require('bluebird');

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
            type: api.types.Mixed,
            default: {}
          },
          // current key value when adding new elements so that they can be tracked
          key: {
            type: Number,
            default: 0
          },
          words: String,
          files: [{
            type: api.types.ObjectId,
            ref: 'file'
          }]
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

              return api.blotter.collection.find({
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
          secure: true,
          populate: ['files']
        },
        // GET: /api/model/id/primary
        primary: {
          secure: false,
          populate: ['files'],
          handler: function() {
            return {
              _id: this._id,
              name: this.name,
              main: this.main,
              files: this.files
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
