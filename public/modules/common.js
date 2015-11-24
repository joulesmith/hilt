"use strict";

define(['angular', 'restangular'], function (angular, restangular){

    var module = angular.module('common', []);


    module.controller('common.error', ['$scope', function($scope){

    }]);

    module.controller('common.vertical_list', ['$scope', function($scope){
        $scope.init = function(rows) {
            $scope.rows = rows;
        };
    }]);

});
