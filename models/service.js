"use strict";


var apimodelfactory = require('./apifactory');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
var error = require('../error');
var Promise = require('bluebird');
var mongoose = require('mongoose');

var ModelError = error('routes.api.service');

var geocoder = require('geocoder');

module.exports = {
    service : {
        state : {
            independent : {
                // payable to for service
                account : { type: mongoose.Schema.Types.ObjectId, ref: 'account', required : true},
                // short name of service
                name : {type: String, default: '', required: true},
                // all searchable categories which this service full-fills
                categories : [String],
                // base price of the service
                price : Number, // USD
                duration : Number, // millisecond duration the service typically takes to perform
                // choices that adjust the price and/or duration of the service
                choice : [{
                    required : Boolean, // is making this choice required to complete service?
                    name : String,
                    default : Number, // index of the default option, or -1 if no default
                    option : [{
                        name : String,
                        priceAdjustment : Number, // +/-USD
                        durationAdjustment : Number, // +/-(ms)
                    }]
                }],
                // subscription details if this service is recurring
                subscription : {
                },
                // times at which this service will be available
                schedule : [{
                    start : Number, // unix time code in milliseconds of when service can be started
                    end : Number // last millisecond when the service must be finished
                }],
                //TODO: change to serviceArea to use $in query
                serviceCenter : mongoose.Schema.Types.Mixed,
                serviceDistance : Number // meters distance from center defining circular service area
            },
            dependent : {
                // all past orders that have been made of this service
                order : [{ type: mongoose.Schema.Types.ObjectId, ref: 'order'}],
                // appointments made for the service at a future date
                appointments : [{ type: mongoose.Schema.Types.ObjectId, ref: 'order'}]
            },
            index : {serviceCenter: "2dsphere"}, // used for searching for nearby services
        },
        create : {
            // all access will be managed by groups, not users
            creatorAccess : [],
            handler : function(req, res) {
                var service = this;

                return mongoose.model('account')
                .findById(req.body.account)
                .populate('managers')
                .exec()
                .then(function(account){
                    if (!account){
                        throw new ModelError('noaccount',
                            'Account was not found.',
                            [],
                            400);
                    }

                    // add manager group's access
                    return service.grantGroupAccess(['root'], account.managers)
                })
            }
        },
        get : {
            security : false
        },
        update : {
            security : true,
            handler : function(req) {
                if (this.available) {
                    throw new ModelError('methodnotallowed',
                        'A product cannot be directly changed once it is made available.',
                        [],
                        405);
                }
            }
        },
        // no restrictions to access, only uses http gets to base url
        static : {
            areasearch : {
                handler : function(req, res) {

                    if (!req.query.location && !(req.query.longitude && req.query.latitude)) {
                        throw new ModelError('nolocation',
                            'Location must be supplied to find service areas.',
                            [],
                            404);
                    }

                    if (req.query.longitude && req.query.latitude) {
                        return mongoose.model('service').find({
                            serviceCenter : {
                                // TODO: this needs to be $within the service area, not an arbitrary distance since it could be outside
                                $near: {
                                    $geometry : {
                                        type: 'Point',
                                        coordinates: [parseFloat(req.query.longitude), parseFloat(req.query.latitude)],
                                    },
                                    $maxDistance: req.query.maxDistance ? parseFloat(req.query.maxDistance) : 10000 // 10km default
                                }
                            }
                        })
                        //.sort({ score : { $meta : 'textScore' } })
                        .exec();
                    }

                    if (req.query.location) {
                        return new Promise(function(resolve, reject){
                            geocoder.geocode(req.query.location, function ( err, data ) {
                                if (err){
                                    return reject(err);
                                }

                                resolve(data);
                            });
                        })
                        .then(function(data){
                            var location = data.results[0].geometry.location;

                            return mongoose.model('service').find({
                                serviceCenter : {
                                    $near: {
                                        $geometry : {
                                            type: 'Point',
                                            coordinates: [location.lng, location.lat],
                                        },
                                        $maxDistance: req.query.maxDistance ? parseFloat(req.query.maxDistance) : 10000 // 10km default
                                    }
                                }
                            })
                            //.sort({ score : { $meta : 'textScore' } })
                            .exec()
                        });
                    }
                }
            }
        },
        // need execute permission, only uses http gets to specific resource
        safe : {},
        // need both execute and write permission, uses http posts to specific resource
        unsafe : {},
        // only accessible on the server
        internal : {}
    }
};
