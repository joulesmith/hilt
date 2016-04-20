"use strict";

var Promise = require('bluebird');

module.exports = function(api){
  return {
    admin: {
      state: {
        independent: {

        },
        dependent: {
          settings: {
            type: api.types.Mixed,
            default: {}
          }
        },
        index: { },
      },
      static: {
        action:{
          root: {}
        }
      },
      view: {
        secure: true,
        root: {}
      },
      action: {
        secure: true,
        root: {},
        configure: {
          parameter: ":model(*)",
          handler: function(req, res){
            if (req.params.model) {
              this.settings[req.params.model] = req.body.settings;
              api[model].configure(req.body.settings);
            }else{
              this.settings = req.body.settings;
            }

            this.markModified('settings');
          }
        }
      },
      internal: {
      }
    }
  };
};
