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

        api.search = function(words) {
            return $http({
                    url: '/api/profile/',
                    method: "GET",
                    params: {
                        words: words
                    }
                })
                .then(function(res) {
                    return res.data;
                })
                .catch(function(res) {
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
        $scope.profiles = [];
        $scope.words = '';
        $scope.search = function(){
            api.search($scope.words)
            .then(function(profiles){
                angular.copy(profiles, $scope.profiles);
            }, function(error){
                $scope.error = error;
            });
        };
    }]);

    // view a single profile
    module.controller('profile.view', ['$scope', '$state', 'profile.api', function($scope, $state, api){
        var _id = $state.params.profileId;

        $scope.profile = {
            rows : []
        };

        $scope.allowed = [
            {
                name : 'row',
                make : function() {
                    return {
                        elements : []
                    };
                }
            }
        ];

        $scope.addRow = function(index) {
            if (index) {
                $scope.profile.rows.splice(index, 0, {
                    elements : []
                })
            }else{
                $scope.profile.rows.push({
                    elements : []
                });
            }
        };

        $scope.moveUp = function(index) {
            if (index > 0) {
                var tmp = $scope.profile.rows[index];
                $scope.profile.rows[index] = $scope.profile.rows[index - 1];
                $scope.profile.rows[index - 1] = tmp;
            }
        };

        $scope.moveDown= function(index) {
            if (index < $scope.profile.rows.length - 1) {
                var tmp = $scope.profile.rows[index];
                $scope.profile.rows[index] = $scope.profile.rows[index + 1];
                $scope.profile.rows[index + 1] = tmp;
            }
        };

        $scope.moveLeft = function(row, index) {
            if (index > 0) {
                var tmp = row.elements[index];
                row.elements[index] = row.elements[index - 1];
                row.elements[index - 1] = tmp;
            }
        };

        $scope.moveRight= function(row, index) {
            if (index < row.elements.length - 1) {
                var tmp = row.elements[index];
                row.elements[index] = row.elements[index + 1];
                row.elements[index + 1] = tmp;
            }
        };

        $scope.addElementTo = function(row) {
            row.elements.push({
                type : 'profile.text',
                text : 'Hello World',
                offset : 0,
                width : 1
            });
        };

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

    module.controller('profile.row', ['$scope', function($scope){
        $scope.isCollapsed = true;

    }]);

    //
    // Controllers for stand-alone components used for viewing profile information
    //

    module.controller('profile.text', ['$scope', function($scope){
        $scope.status = {
            edit : false,
            text_tmp : 'stuff'
        };

        $scope.init = function(element) {
            $scope.element = element;
            $scope.status.text_tmp = element.text;
        };

        $scope.edit = function() {
                $scope.element.text = $scope.status.text_tmp;
                $scope.status.edit = false;
        };


    }]);

});
