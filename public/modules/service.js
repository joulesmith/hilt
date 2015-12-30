"use strict";

define(['angular', 'lodash'], function (angular, lodash){

    //
    // module for common interactions with the profile model
    //
    var module = angular.module('service', ['dialogs.main'])
    .config(['$urlRouterProvider', '$stateProvider', 'uiGmapGoogleMapApiProvider', function($urlRouterProvider, $stateProvider, GoogleMapApi){

        GoogleMapApi.configure({
            key: 'AIzaSyD7gui4zT6BFUeVtiD-fsCHMGvqXo6GDzY',
            v: '3.20',
            libraries: 'weather,geometry,visualization'
        });

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

    module.controller('service.edit', ['$scope','$window','$state','$uibModal','dialogs','apifactory.models','uiGmapLogger','uiGmapGoogleMapApi',
    function($scope, $window, $state, $uibModal, dialogs, models, $log, GoogleMapApi) {
        $scope.service = {};
        $scope.account = {};
        $log.currentLevel = $log.LEVELS.debug;
        $scope.address = '';
        $scope.radius = 10;
        $scope.radiusUnits = '1000';
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

        GoogleMapApi.then(function(maps) {
            $scope.googleVersion = maps.version;
            maps.visualRefresh = true;
            var geocoder = new maps.Geocoder();

            $scope.map = {
                center : { latitude: 45, longitude: -73 },
                zoom: 8,
                control: {},
                options : {
                    scaleControl : true
                }
            };

            $scope.serviceArea = {
                center : { latitude: 45, longitude: -73 },
                radius : 10000, // meters?
                stroke: {
                    color: '#08B21F',
                    weight: 2,
                    opacity: 1
                },
                fill: {
                    color: '#08B21F',
                    opacity: 0.5
                },
                geodesic: true, // optional: defaults to false
                draggable: true, // optional: defaults to false
                clickable: true, // optional: defaults to true
                editable: true, // optional: defaults to false
                visible: true, // optional: defaults to true
                control: {},
                events : {
                    radius_changed : function(circle){
                        $scope.radius = (circle.radius / parseFloat($scope.radiusUnits));
                    }
                }
            };

            $scope.computeRadius = function() {
                $scope.serviceArea.radius = $scope.radius * parseFloat($scope.radiusUnits);
            };

            $scope.computeRadius();

            $scope.setAreaCenter = function() {

                if ($scope.address !== '') {
                    // need to use google geocoding to convert the address
                    geocoder.geocode({
                        address : $scope.address
                    }, function(results, status) {
                        if (status == maps.GeocoderStatus.OK) {

                            var map = $scope.map.control.getGMap();
                            map.setCenter(results[0].geometry.location);

                            $scope.$apply(function(){
                                $scope.serviceArea.center.latitude = results[0].geometry.location.lat();
                                $scope.serviceArea.center.longitude = results[0].geometry.location.lng();
                            });

                        } else {
                            window.alert('Geocode was not successful for the following reason: ' + status);
                        }
                    });

                }else if ($scope.position) {

                    $scope.serviceArea.center.latitude = $scope.position.coords.latitude;
                    $scope.serviceArea.center.longitude = $scope.position.coords.longitude;
                    $scope.map.center.latitude = $scope.position.coords.latitude;
                    $scope.map.center.longitude = $scope.position.coords.longitude;
                }else{
                    $scope.error = new Error("Must give a location to search.");
                }
            };
        });

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

                $scope.addChoice = function(){
                    $scope.service.choice.push({
                        required : false, // is making this choice required to complete service?
                        name : '',
                        default : -1, // index of the default option, or -1 if no default
                        option : []
                    })
                };

                $scope.deleteChoice = function(choice) {
                    var index = $scope.service.choice.indexOf(choice);

                    dialogs.confirm(
                        "Delete Choice?",
                        "Are you sure you want to delete the choice \'" + choice.name + "\'?"
                    ).result
                    .then(function(){
                        $scope.service.choice.splice(index, 1);
                    });

                };
            }
        });

    }]);

    module.controller('service.choice.edit', ['$scope', '$uibModal', 'dialogs', function($scope, $uibModal, dialogs){

        $scope.selectedOption = null;

        $scope.editOption = function(option) {

            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'service.option.edit.modal',
                controller: 'service.option.edit.modal',
                size: 'lg',
                resolve: {
                    option: function() {
                        return option;
                    }
                }
            });

            modalInstance.result
            .then(function(editedOption) {
                // editedOption and option are the same object
                //angular.copy(editedOption, option);
            });
        };

        $scope.addOption = function(choice) {

            choice.option.push({
                name : '',
                priceAdjustment : 0, // +/-USD
                durationAdjustment : 0, // +/-(ms)
            });

            $scope.selectedOption = choice.option[choice.option.length-1];

            $scope.editOption($scope.selectedOption);
        };

        $scope.deleteOption = function(choice, option) {
            var index = choice.option.indexOf(option);

            dialogs.confirm(
                "Delete Option?",
                "Are you sure you want to delete the option \'" + option.name + "\'?"
            ).result
            .then(function(){
                choice.option.splice(index, 1);

                $scope.selectedOption = choice.option[0];
            });

        };
    }]);

    module.controller('service.option.edit.modal', ['$scope', '$uibModalInstance', 'option', function($scope, $uibModalInstance, option){

        $scope.option = option;


        $scope.ok = function () {
          $uibModalInstance.close($scope.option);
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
    }]);
});
