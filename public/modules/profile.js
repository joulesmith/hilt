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

    // this is to ensure inputs are integers (not strings) when needed
    module.directive('number', function(){
        return {
            require: 'ngModel',
            link: function(scope, ele, attr, ctrl){
                ctrl.$parsers.unshift(function(viewValue){
                    return Number(viewValue);
                });
            }
        };
    });

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

        api.saveProfile = function(_id, profile) {
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
                $scope.error = null;
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

        $scope.status = {
            edit : false
        };

        $scope.isCollapsed = true;

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

            if (typeof index !== 'undefined') {
                $scope.profile.rows.splice(index, 0, {
                    elements : []
                })
            }else{
                $scope.profile.rows.push({
                    elements : []
                });
            }
        };

        $scope.deleteRow = function(index) {
            $scope.profile.rows.splice(index, 1);
        }

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
            if (row.elements[index].offset > 0) {
                row.elements[index].offset--;
                if (index < row.elements.length - 1) {
                    row.elements[index + 1].offset++;
                }
            }else if (index > 0) {
                var tmp_element = row.elements[index];
                tmp_element.offset = row.elements[index - 1].offset;
                row.elements[index - 1].offset = 0;
                row.elements[index] = row.elements[index - 1];
                row.elements[index - 1] = tmp_element;
            }
        };

        $scope.moveRight= function(row, index) {
            var offset = 0.0;
            for(var i = 0; i < index; i++) {
                offset += row.elements[i].offset + row.elements[i].width;
            }

            if (index === row.elements.length - 1) {
                if (row.elements[index].offset < 12 - row.elements[index].width - offset) {
                    row.elements[index].offset++;
                }
            }else if (row.elements[index + 1].offset > 0) {
                row.elements[index].offset++;
                row.elements[index + 1].offset--;
            }else {
                var tmp_element = row.elements[index];

                row.elements[index] = row.elements[index + 1];
                row.elements[index].offset = tmp_element.offset;
                tmp_element.offset = 0;
                row.elements[index + 1] = tmp_element;
            }
        };

        $scope.changeWidth= function(row, index) {

        };

        $scope.addTextTo = function(row) {
            row.elements.push({
                type : 'profile.text',
                text : '',
                offset : 0,
                width : 1
            });
        };

        $scope.addImageTo = function(row) {
            row.elements.push({
                type : 'profile.image',
                src : '',
                offset : 0,
                width : 1
            });
        };

        $scope.clipboard = null;

        $scope.cutElement = function(row, index) {
            if (index < row.elements.length - 1) {
                row.elements[index + 1].offset += row.elements[index].offset + row.elements[index].width;
            }

            $scope.clipboard = row.elements[index];
            row.elements.splice(index, 1);
        };

        $scope.pasteElement = function(row) {
            if ($scope.clipboard) {
                $scope.clipboard.offset = 0;
                row.elements.push($scope.clipboard);
                $scope.clipboard = null;
            }
        };

        $scope.save = function() {
            $scope.profile.data = JSON.stringify($scope.profile.rows);
            api.saveProfile($scope.profile._id, $scope.profile)
            .then(function(profile){
                $scope.error = null;
            })
            .catch(function(error){
                $scope.error = error;
            });
        };

        if (_id && _id !== '') {
            api.getProfile(_id, $scope.profile)
            .then(function(profile){

                if ($scope.profile.data !== ''){
                    $scope.profile.rows = JSON.parse($scope.profile.data);
                }else{
                    $scope.profile.rows = [];
                }

                $scope.error = null;
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
                $scope.error = null;
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



    }]);

    module.controller('profile.image', ['$scope', '$uibModal', function($scope, $uibModal){

        $scope.upload = function() {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'file.upload',
                controller: 'file.upload',
                size: null,
                resolve: {
                    remoteFile: function() {
                        return $scope.remoteFile;
                    }
                }
            });

            modalInstance.result
            .then(function(remoteFile) {
                $scope.element.src = '/api/file/' + remoteFile._id + '/data';
            });
        };

    }]);
});
