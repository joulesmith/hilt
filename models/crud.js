"use strict";

// Basic example implementing a create-read-update-delete model
module.exports = function(api){
  return {
    crud: {
      state: {
        independent: {
          data: api.types.Mixed
        }
      },
      static: {
        action: {
          // create
          root: {}
        }
      },
      view: {
        secure: false,
        // read
        root: {}
      },
      action: {
        secure: false,
        // update
        root: {},
        // delete
        delete: {}
      }
    }
  };
};
