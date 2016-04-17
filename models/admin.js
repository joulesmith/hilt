"use strict";

var Promise = require('bluebird');

module.exports = function(api){
  return {
    admin: {
      state: {
        independent: {

        },
        dependent: {

        },
        index: { },
      },
      static: {
        action:{
          root: {
          }
        }
      },
      view: {
        root: {
          secure: true
        }
      },
      action: {
        root: {
          secure: true
        }
      },
      internal: {
      }
    }
  };
};
