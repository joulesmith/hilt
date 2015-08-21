/*
    Copyright (C) 2015  Joulesmith Energy Technologies, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/


var crypto = require('crypto');
var mongoose = require('mongoose');

exports.add_hash_methods = function(schema, hash_properties) {

    schema.methods.computeHash = function(cb) {
        var f = crypto.createHash('sha256');

        var object_props = [];

        for(var prop in hash_properties) {
            if (this.hasOwnProperty(prop)) {

                if (hash_properties[prop] === '') {

                    // convert everything to JSON string since who knows what it is
                    f.update(JSON.stringify(this[prop]));

                }else{
                    object_props.push(hash_properties[prop]);
                }
            }
        }

        var add_object_hash = function() {

            if (object_props.length === 0) {
                return cb(null, f.digest('hex'));
            }

            var prop = object_props.pop();

            this.populate(prop, function(err){
                if (err) {return cb(err);}

                if (this[prop].hash === "") {
                    return cb(new Error("Hash has not been computed!"));
                }

                // hash is known to be a string so don't need to worry
                f.update(this[prop].hash);

                add_object_hash();
            })
        };

        add_object_hash();
    };

    schema.methods.verifyHash = function(cb) {

        this.computeHash(function(err, hash){
            if (err) {return cb(err);}

            cb(null, hash === this.hash)
        });
    };

    schema.methods.setHash = function(cb) {

        if (this.hash === "") {

            this.compute_hash(function(err, hash){

                if (err){return cb(err);}

                this.hash = hash;

                this.save(cb);
            });

        }else{
            cb(new Error("Hash has already been computed!"));
        }
    };

    return schema;
};
