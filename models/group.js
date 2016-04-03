"use strict";

var Promise = require('bluebird');
var mongoose = require('mongoose');

module.exports = function(api){
  return {
    group: {
      state: {
        independent: {
          name: {
            type: String,
            default: ''
          },
        },
        dependent: {
          users: [String],
          accessRecords: mongoose.Schema.Types.Mixed
        },
        index: null, // used for text searches
      },
      static: {},
      view: {
        secure: true
      },
      action: {
        secure: true,
        add: {
          handler: function(req, res) {
            var group = this;
            var user_id = '' + req.body.userId;

            return api.user.collection.findById(user_id).exec()
              .then(function(user) {
                if (!user) {
                  throw new api.group.Error('nouser',
                    'The user could not be found.', [],
                    404);
                }

                return group.add(user);
              });
          }
        },
        remove: {
          handler: function(req, res) {
            var group = this;
            var user_id = '' + req.body.userId;

            return api.user.collection.findById(user_id).exec()
              .then(function(user) {
                if (!user) {
                  throw new api.group.Error('nouser',
                    'The user could not be found.', [],
                    404);
                }

                return group.remove(user);
              });
          }
        }
      },
      // only accessible on the server
      internal: {
        add: function(user) {
          var user_id = '' + user._id;
          var index = _.sortedIndex(this.users, user_id);

          this.users.slice(index, 0, user_id);

          return user.addGroup(this).return(this.save());
        },
        remove: function(user) {
          var user_id = '' + user._id;
          var index = _.indexOf(this.users, user_id, true);

          this.users.slice(index, 1);

          return user.removeGroup(this).return(this.save());
        },
        accessGranted: function(model, actions, resource) {
          var group = this;
          var resource_id = '' + resource._id;

          if (!group.accessRecords) {
            group.accessRecords = {};
          }

          if (!group.accessRecords[model]) {
            group.accessRecords[model] = {
              id: [],
              actions: []
            };
          }

          var recordIndex = _.sortedIndex(group.accessRecords[model].id, resource_id);


          if (group.accessRecords[model].id[recordIndex] !== resource_id) {
            group.accessRecords[model].id.splice(recordIndex, 0, resource_id);
            group.accessRecords[model].actions.splice(recordIndex, 0, []);
          }

          group.accessRecords[model].actions[recordIndex] = _.union(group.accessRecords[model].actions[recordIndex], actions);

          group.markModified('accessRecords');

          return group.save();
        },
        accessRevoked: function(model, actions, resource) {
          var group = this;
          var resource_id = '' + resource._id;

          if (group.accessRecords[model]) {
            var recordIndex = _.sortedIndex(group.accessRecords[model].id, resource_id);

            if (recordIndex !== -1) {

              group.accessRecords[model].actions[recordIndex] = _.without(group.accessRecords[model].actions[recordIndex], actions);

              if (group.accessRecords[model].actions[recordIndex].length === 0) {
                // if no actions can be be performed, remove resource
                group.accessRecords[model].id.splice(recordIndex, 1);
                group.accessRecords[model].actions.splice(recordIndex, 1);

                if (group.accessRecords[model].id.length === 0) {
                  // if there are no more resources of this type, then remove Model
                  delete group.accessRecords[model];
                }
              }
            }
          }

          group.markModified('accessRecords');

          return group.save();
        }
      }
    }
  };
};
