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
var config = require('../config');
var mongoose = require('mongoose');
var _ = require('lodash');

var ModelError = error('routes.api.cart');


module.exports = function(server) {
    apimodelfactory(server, {
        group : {
            state : {
                independent : {
                    groups : [{type: mongoose.Schema.Types.ObjectId, ref : 'group'}],
                },
                dependent : {
                    accessRecords : mongoose.Schema.Types.Mixed
                },
                index : null, // used for text searches
            },
            create : null,
            get : {
                secure : true
            }
            update : {
                secure : true
            },
            // no restrictions to access, only uses http gets to base url
            static : {
            },
            // need execute permission, only uses http gets to specific resource
            safe : {},
            // need both execute and write permission, uses http posts to specific resource
            unsafe : {},
            // only accessible on the server
            internal : {
                accessGranted : function(model, actions, resource) {
                    var group = this;

                    if (!group.accessRecords){
                        group.accessRecords = {
                            records : [],
                            actions : []
                        };
                    }

                    var record = model + '/' + resource._id;

                    var recordIndex = _.sortedIndex(group.accessRecords.records, record);

                    if (group.accessRecords.records[recordIndex] !== record) {
                        group.accessRecords.records.splice(recordIndex, 0, record);
                        group.accessRecords.actions.splice(recordIndex, 0, {});
                    }

                    actions.forEach(function(action){
                        group.accessRecords.actions[recordIndex][action] = true;
                    });

                    group.markModified('accessRecords');

                    return group.save();
                },
                accessRevoked : function(model, actions, resource) {
                    var group = this;

                    var record = model + '/' + element._id;
                    var recordIndex = _.indexOf(group.accessRecords.records, record, true);

                    actions.forEach(function(action){
                        group.accessRecords.actions[recordIndex][action] = false;
                    });

                    group.markModified('accessRecords');

                    return group.save();
                }
            }
        }
    });
};
