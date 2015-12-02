"use strict";

define(['angular', 'marked', 'MathJax'], function (angular, marked, MathJax){

    var module = angular.module('common', []);

    module.directive("mathjaxMarkdown", function() {
        return {
            restrict: "A",
            controller: ["$scope", "$element", "$attrs", function($scope, $element, $attrs) {
                $scope.$watch($attrs.mathjaxMarkdown, function(value) {

                    $element.html(marked(value));

                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, $element[0]]);
                });
            }]
        };
    });

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
