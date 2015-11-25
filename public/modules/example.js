/**
 * This document is for example purposes only.
 */

"use strict";

define(['angular'], function (angular){

    //
    // module for common interactions with the example model
    //
    var module = angular.module('example', [])
        .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){
            $stateProvider
                .state('example', {
                    url : '/example',
                    templateUrl : 'example'
                })
                .state('example.[sub_state]', {
                    url : '/[sub_state]',
                    templateUrl : 'example.[sub_state]',
                    controller : 'example.[sub_state]'
                });
        }]);

    //
    // factory to the example model api
    //
    module.factory('example.api', ['$window', '$http', function($window, $http){

        var api = {};

        api.getter = function(_id, destination) {

            return $http.get('/api/examples/' + _id)
                .then(function(res){
                    if (res.data) {
                        angular.copy(res.data, destination);
                    }

                    return destination;
                }, function(res){
                    // TODO this doesn't seem right, maybe use Error somehow?
                    throw res.data.error;
                });
        };

        api.setter = function(_id, source) {
            return $http.post('/api/examples/' + _id, source)
                .then(function(res){
                    return source;
                }, function(res){
                    // TODO this doesn't seem right, maybe use Error somehow?
                    throw res.data.error;
                });
        };

        return api;
    });

    //
    // Controllers for the views of the sub-states of the same name
    //

    // example state view controller
    module.controller('example.[sub_state]', ['$scope', '$state', 'example.api', function($scope, $state, api){

    }]);

    //
    // Controllers for stand-alone components used for viewing example information
    //

    // example component view controller
    module.controller('example.[component_name]', ['$scope', 'example.api', function($scope, api){

    }]);

});
