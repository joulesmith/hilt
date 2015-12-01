"use strict";

var apimodelfactory = require('./apifactory');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
var error = require('../error');
var Promise = require('bluebird');

var FileError = error('routes.api.file');

module.exports = function(app) {
    apimodelfactory(app, {
        file : {
            authenticate : {
                write : true, // require user authorization and permission to do this
                read : false, // anyone
                execute : false // anyone
            },
            state : {
                settable : {

                },
                internal : {
                    name : {type : String, default : ''},
                    type : {type : String, default : ''},
                    size : {type : Number, default : 0},
                    hash : {type : String, default : '', index : true}
                },
                index : {owner: 1, name: 1}, //
            },
            create : function(req){
                var file = this;

                var form = new formidable.IncomingForm();

                form.hash = 'sha1';

                return (new Promise(function (resolve, reject) {
                    try {
                        // TODO: check to see if user has already uploaded this file using file hash
                        // TODO: use promisify somehow to convert to promise directly?
                        form.parse(req, function(err, fields, files) {

                            if (err) {return reject(err);}

                            // move the file to the output folder
                            // TODO: have this set from configuration file
                            fs.renameSync(files.file.path, path.join(__dirname, 'uploads', '' + file._id) );

                            file.name = files.file.name;
                            file.type = files.file.type;
                            file.size = files.file.size;
                            file.hash = files.file.hash;
                            resolve(file);
                        });

                    }catch(err) {
                        reject(err);
                    }
                }))
                .then(function(file){
                    return file.save();
                });

            },
            update : function(req) {
                throw new FileError('methodnotallowed',
                    'A file cannot be changed once uploaded. Upload to a new file.',
                    [],
                    405);
            },
            // no restrictions to access, only uses http gets to base url
            static : {},
            // need execute permission, only uses http gets to specific resource
            safe : {
                // GET /api/file/:id/data
                data : function(req, res) {
                    var file = this;

                    var options = {
                        root: path.join(__dirname, 'uploads'),
                        dotfiles: 'deny',
                        headers: {
                            'x-timestamp': Date.now(),
                            'x-sent': true
                        }
                    };


                    return (new Promise(function (resolve, reject) {
                        res.setHeader("Content-Type", file.type);
                        res.sendFile(file._id, options, function(err){
                            if (err){
                                reject(err);
                            }else{
                                resolve();
                            }
                        });
                    }));
                }
            },
            // need both execute and write permission, uses http posts to specific resource
            unsafe : {},
            // only accessible on the server
            internal : {

            }
        }
    });
};
