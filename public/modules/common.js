"use strict";

define(['angular', 'marked'], function (angular, marked){

    var module = angular.module('common', []);

    module.directive('markdown', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var getter = $parse(attrs.markdown);
                var text = getter(scope);

                element.html(marked(text));

            }
        };
    }]);

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
