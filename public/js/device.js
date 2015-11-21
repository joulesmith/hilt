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

"use strict";

define(function (){

    return function(Restangular, io, auth){
        var model = {};

        var Devices = Restangular.all('device');
        var Panels = Restangular.all('panel');

        model.device_list = [];
        model.device_details = null;
        model.channel_list = [];
        model.channel_details = null;

        model.getAllDevices = function() {
            model.device_list = Devices.getList(null, null, auth.getHeader());
        };

        model.getDevice = function(device) {
            model.device_details = device.get(null, null, auth.getHeader());
        };

        model.getChannelByName(device_name) {
            model.channel_details = Devices.one(device_name).get(null, null, auth.getHeader());
        };

        model.getAllChannels = function(device) {
            model.channel_list = device.all('channel').getList(null, null, auth.getHeader());
        };

        model.getChannel(channel) {
            model.channel_details = channel.get(null, null, auth.getHeader());
        };

        model.getChannelById(device_name, channel_id) {
            model.channel_details = Devices.one(device_name).one('channel', channel_id).get(null, null, auth.getHeader());
        };

        model.createChannel = function(device, spec) {
            model.channel_details = device.post('channel', spec, auth.getHeader());
        };

        model.updateChannel = function(channel) {
            model.channel_details = channel.put(null, null, auth.getHeader());
        };

        model.activateChannel = function(channel) {
            model.channel_details = channel.all('data').put(null, null, auth.getHeader());
        };

        return model;
    };
});
