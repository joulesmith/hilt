"use strict";

define(['angular', 'lodash'], function (angular, lodash){

    //
    // module for common interactions with the profile model
    //
    var module = angular.module('service', ['dialogs.main'])
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

    module.controller('service.edit',
        ['$scope',
        '$window',
        '$state',
        '$uibModal',
        'dialogs',
        'apifactory.models',
    function($scope, $window, $state, $uibModal, dialogs, models){
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
