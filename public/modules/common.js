"use strict";

define(['angular', 'restangular'], function (angular, restangular){

    var module = angular.module('common', []);


    module.controller('common.error', ['$scope', function($scope){

    }]);

    module.controller('common.grid', ['$scope', function($scope){
        $scope.init = function(grid, allowed) {
            $scope.grid = grid;
            $scope.allowed = allowed;
            $scope.add_row = function() {
                grid.rows.push({
                    elements : []
                });
            };
        };
    }]);

});
