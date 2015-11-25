"use strict";

define(['angular'], function (angular){

    //
    // module for common interactions with the profile model
    //
    var module = angular.module('profile', [])
        .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){
            $stateProvider
                .state('profile', {
                    url : '/profile',
                    templateUrl : 'profile'
                })
                .state('profile.search', {
                    url : '/search',
                    templateUrl : 'profile.search',
                    controller : 'profile.search'
                })
                .state('profile.create', {
                    url : '/create',
                    templateUrl : 'profile.create',
                    controller : 'profile.create'
                })
                .state('profile.view', {
                    url : '/:profileId',
                    templateUrl : 'profile.view',
                    controller : 'profile.view'
                });
        }]);

    //
    // factory to the profile model api
    //
    module.factory('profile.api', ['$window', '$http', function($window, $http){

        var api = {};

        api.getProfile = function(_id, profile) {

            return $http.get('/api/profile/' + _id)
                .then(function(res){

                    if (res.data) {
                        angular.copy(res.data, profile);
                    }

                    return profile;
                })
                .catch(function(res){
                    // TODO: this doesn't seem right, maybe use Error somehow?
                    throw res.data.error;
                });
        };

        profile.saveProfile = function(_id, profile) {
            return $http.post('/api/profile/' + _id, profile)
                .then(function(res){
                    return profile;
                })
                .catch(function(res){
                    // TODO: this doesn't seem right, maybe use Error somehow?
                    throw res.data.error;
                });
        };

        api.createProfile = function(name) {
            return $http.post('/api/profile/', {name : name})
                .then(function(res){
                    return res.data;
                })
                .catch(function(res){
                    // TODO: this doesn't seem right, maybe use Error somehow?
                    throw res.data.error;
                });
        };

        return api;
    }]);

    //
    // Controllers for the views of the sub-states of the same name
    //

    // search for profiles
    module.controller('profile.search', ['$scope', '$state', 'profile.api', function($scope, $state, api){


    }]);

    // view a single profile
    module.controller('profile.view', ['$scope', '$state', 'profile.api', function($scope, $state, api){
        var _id = $state.params.profileId;

        $scope.profile = {};

        if (_id && _id !== '') {
            api.getProfile(_id, $scope.profile)
            .then(function(profile){

            })
            .catch(function(error){
                $scope.error = error;
            });
        }

    }]);

    // create a new profile
    module.controller('profile.create', ['$scope', '$state', 'profile.api', function($scope, $state, api){
        $scope.name = '';

        $scope.submit = function() {
            api.createProfile($scope.name)
            .then(function(profile){
                $state.go('profile.view', {profileId : profile._id});
            })
            .catch(function(error){
                $scope.error = error;
            });
        };
    }]);

    //
    // Controllers for stand-alone components used for viewing profile information
    //

    module.controller('profile.text', ['$scope', function($scope){
        $scope.init = function(element) {
            $scope.element = element;
        };
    }]);

});
