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

var SocketBundleSchema = new mongoose.Schema({
    name: {type: String, lowercase: true, unique: true},

    // When a Socket.io connection is made, and a request for this panel is made,
    // all channels will be streamed through the websocket, interpreted as variables.
    // this handles all authorization and permissions for setting up the connection.

    // channel to stream data from. The use must have read access in order
    // to stream data from the channel. If not they will be warned about this.
    channels :[{type: mongoose.Schema.Types.ObjectId, ref: 'dacChannel' }],
    variables : [{
        // short and easy name that can be used to bind to in a panel
        name_data : String,
        name_control : String,
        // whether or not the panel will try to control this channel.
        // user will need execute access to the channel in order to do so.
        // this will warn the other side of any potential problems.
        control : {type : Boolean, default : false}
    }],

    read : {type : Boolean, default : false},
    execute : {type : Boolean, default : false},
    write : {type : Boolean, default : false},
});

mongoose.model('dacSocketBundle', SocketBundleSchema);
