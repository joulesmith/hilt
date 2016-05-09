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
            }else{
              this.settings = req.body.settings;
            }

            this.configure();

            this.markModified('settings');

            return this.settings;
          }
        }
      },
      internal: {
        configure: function() {

          for (var model in api) {
            if (this.settings[model]) {
              api[model].settings = this.settings[model];
            }
          }

          for (var model in api) {
            if (api[model].configure) {
              api[model].configure();
              api[model].editEvent();
            }
          }
        }
      }
    }
  };
};
