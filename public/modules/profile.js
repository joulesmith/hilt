"use strict";

define(['angular', 'restangular'], function (angular, restangular){

    var module = angular.module('profile', [])
        .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){
            $stateProvider
                .state('profile', {
                    url : '/profile/:profileId',
                    templateUrl : 'profile'
                });
        }]);

    module.factory('profile.api', ['$window', '$http', function($window, $http){

    });

    module.controller('profile.home', ['$scope', '$state', 'profile.api', function($scope, $state, api){

    }]);

    module.controller('profile.text', ['$scope', function($scope){
        $scope.init = function(element) {
            $scope.element = element;
        };
    }]);

});
