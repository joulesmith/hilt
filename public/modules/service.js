"use strict";

define(['angular', 'lodash'], function (angular, lodash){

    //
    // module for common interactions with the profile model
    //
    var module = angular.module('service', [])
        .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){

            $stateProvider
                .state('service', {
                    url : '/service',
                    templateUrl : 'service'
                })
                .state('service.areasearch', {
                    url : '/areasearch',
                    templateUrl : 'service.areasearch',
                    controller : 'service.areasearch'
                })
                .state('service.edit', {
                    url : '/:serviceId/edit',
                    templateUrl : 'service.edit',
                    controller : 'service.edit'
                });
        }]);

    module.controller('service.areasearch', ['$scope', '$window', 'apifactory.models', function($scope, $window, models){
        $scope.location = '';

        $scope.categories = {
            'category' : 'section',
            'options' : {
                'hardware' : {
                    'category' : 'stuff',
                    'options': {
                        'screws' : null,
                        'nails' : null
                    }
                },
                'paint' : {
                    'category' : 'color',
                    'options': {
                        'red' : null,
                        'blue' : null
                    }
                }
            }
        };

        $scope.currentCategories = [$scope.categories];

        $scope.select = function(index, choice) {
            if (choice !== $scope.currentCategories[index].selection) {
                $scope.currentCategories[index].selection = choice;
                $scope.currentCategories = $scope.currentCategories.slice(0, index + 1);
                if ($scope.currentCategories[index].options[choice]) {
                    $scope.currentCategories.push($scope.currentCategories[index].options[choice]);
                }
            }
        };

        $scope.position;

        $scope.getLocation = function () {
            if ($window.navigator.geolocation) {
                $window.navigator.geolocation.getCurrentPosition(function(position){
                    if (!position.coords) {
                        return $scope.error = new Error("No coordinates detected from browser.");
                    }

                    $scope.$apply(function(){
                        $scope.position = position;
                    });
                });
            } else {
                $scope.error = new Error("Geolocation is not supported by this browser.");
            }
        };

        models(['user', 'service'])
        .then(function(api){
            $scope.search = function() {
                var res;

                if ($scope.location !== '') {
                    res = api.service.static.areasearch({
                        location: $scope.location
                    });
                }else if ($scope.position) {
                    res = api.service.static.areasearch({
                        longitude: $scope.position.coords.longitude,
                        latitude: $scope.position.coords.latitude
                    });
                }else{
                    $scope.error = new Error("Must give a location to search.");
                }

                res.then(function(services){
                    $scope.services = services;
                    $scope.error = null;
                })
                .catch(function(error){
                    $scope.error = error;
                });

            };
        });

    }]);

    module.controller('service.preview', ['$scope', '$window', 'apifactory.models', function($scope, $window, models){

        models(['user', 'service'])
        .then(function(api){

        });

    }]);

    module.controller('service.edit', ['$scope', '$window', '$state', 'apifactory.models', function($scope, $window, $state, models){
        $scope.service = {};
        $scope.account = {};

        models(['user', 'account','service'])
        .then(function(api){
            var _id = $state.params.serviceId;

            if (_id && _id !== '') {
                api.service.get(_id)
                .then(function(service){
                    angular.copy(service, $scope.service);

                    $scope.error = null;

                    return api.account.get(service.account);
                })
                .then(function(account){
                    angular.copy(account, $scope.account);
                })
                .catch(function(error){
                    $scope.error = error;
                });

                $scope.update = function() {
                    api.service.update(_id, $scope.service)
                    .then(function(){
                        $scope.error = null;
                    })
                    .catch(function(error){
                        $scope.error = error;
                    });
                };
            }
        });

    }]);
});
