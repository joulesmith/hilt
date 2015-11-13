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

var mongoose = require('mongoose');
var crypto = require('crypto');


var JWTSecretSchema = new mongoose.Schema({
  secret: String,
  date : Date
});

JWTSecretSchema.methods.change = function(){
  this.secret = crypto.randomBytes(16).toString('hex');
  this.date = Date.now();
};

mongoose.model('broadsword_jwtSecret', JWTSecretSchema);
