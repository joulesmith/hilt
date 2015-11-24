"use strict";

define(['angular', 'restangular'], function (angular, restangular){

    var module = angular.module('profile', [])
        .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){
            $stateProvider
                .state('profile', {
                    url : '/profile/:profileId',
                    templateUrl : 'profile',
                    controller : 'profile.main'
                });
        }]);

    module.factory('profile.api', ['$window', '$http', function($window, $http){

        var api = {};

        api.getProfile = function(_id, profile) {

            return $http.get('/api/profiles/' + _id)
                .then(function(res){
                    if (res.data.profile) {
                        angular.copy(res.data.profile, profile);
                    }

                    return profile;
                });
        };

        profile.saveProfile = function(_id, profile) {
            return $http.post('/api/profiles/' + _id, profile)
                .then(function(res){
                    return profile;
                });
        };

        api.createProfile = function(name) {
            return $http.post('/api/profiles/', {name : name})
                .then(function(res){
                    return res.data.profile;
                });
        };

        return api;
    });

    module.controller('profile.main', ['$scope', '$state', 'profile.api', function($scope, $state, api){
        var _id = $state.params.profileId;

        $scope.profile = {};

        if (_id && _id !== '') {
            api.getProfile(_id, $scope.profile)
            .then(function(profile){

            }, function(res){
                $scope.error = res.data.error;
            });
        }

    }]);

    module.controller('profile.text', ['$scope', function($scope){
        $scope.init = function(element) {
            $scope.element = element;
        };
    }]);

});
