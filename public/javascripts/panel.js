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
        var Panels = Restangular.all('panel');


        model.panel_list = [];
        model.panel_details = null;

        var socket = null;
        var panelWorker = null;

        model.panel_data = null;
        model.panel_control = null;

        model.getAllPanels = function() {
            model.panel_list = Panels.getList(null, null, auth.getHeader());
        };

        model.findPanels = function(query) {
            model.panel_list = Panels.getList(null, query, auth.getHeader());
        };

        model.getPanelById = function(panel_id) {
            model.panel_details = Panels.one(panel_id).get(null, null, auth.getHeader());
        };

        model.startPanel = function(panel) {

            Restangular.one('bundle', panel.bundle)
            .get(null, null, auth.getHeader())
            .then(function(bundle){

                //setup panel socket.
                socket = io.connect('./bundle');

                socket.on('connect', function(){
                    socket.emit('request_permission', {bundle_id : bundle._id});
                });



                // setup worker for data filtering in a web worker as data comes in
                panelWorker = new Worker(
                    window.URL.createObjectURL(
                        new Blob([
                            panel.data_filter
                        ])
                    )
                );

                panelWorker.onmessage = function(e) {

                    // only alter the variables which are sent
                    for(var prop in e.data) {
                        if (e.data.hasOwnProperty(prop)) {
                            model.panel_data[prop] = e.data[prop];
                        }
                    }
                };

                model.panel_control = {};

                for(var i = 0; i < bundle.channels.length; i++) {

                    // bind the io events to data input to the filter via variable name
                    (function(variable_name) {
                        socket.on('data_' + bundle.channels[i], function(data){

                            var msg = {};
                            msg[variable_name] = data;

                            panelWorker.postMessage(msg);
                        });
                    })(bundle.variables[i].name_data);

                    // if we are requesting control.
                    if (bundle.variables[i].control) {
                        // add a  function which will send
                        // control data as an event to the channel
                        model.panel_control[bundle.variables[i].name_control] =
                        (function(event_name) {
                            return function(data) {
                                socket.emit(event_name, data);
                            };
                        })('control_' + bundle.channels[i]);
                    }
                }
            });

        };

        model.stopPanel = function() {
            if (socket) {
                socket.disconnect();
                socket = null;
            }

            if (panelWorker) {
                panelWorker.terminate();
                panelWorker = null;
            }

            model.panel_control = null;
            model.panel_data = null;
        };

        return model;
    };
});
