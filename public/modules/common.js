"use strict";

define(['angular', 'marked', 'MathJax'], function (angular, marked, MathJax){

    var module = angular.module('common', []);

    module.directive("mathjaxMarkdown", function($sanitize) {
        return {
            restrict: "A",
            controller: ["$scope", "$element", "$attrs", function($scope, $element, $attrs) {
                $scope.$watch($attrs.mathjaxMarkdown, function(value) {
                    var TeXElements = [];

                    // The use of \( or \[ to mark LaTeX acts as an extension to the
                    // markdown format, since those characters would have other meanings
                    // So all sections marked for LaTeX have to be removed so they don't
                    // get converted to Markdown first.
                    var noTeX = value.replace(/\\[\(\[](.+)\\[\)\]]/gi, function (x){
                        TeXElements.push(x);
                        return "TmpTexReplacementMarker";
                    });

                    var markdowned = marked(noTeX);
                    var cur_tex = 0;

                    // Not put back the LaTeX sections so that MathJax will process them
                    // into math
                    var reTeX = markdowned.replace(/TmpTexReplacementMarker/gi, function (x){

                        var tex = TeXElements[cur_tex];
                        cur_tex++;
                        return tex;
                    });

                    $element.html($sanitize(reTeX));

                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, $element[0]]);
                });
            }]
        };
    });

    module.directive("mathjax", function($sanitize) {
        return {
            restrict: "A",
            controller: ["$scope", "$element", "$attrs", function($scope, $element, $attrs) {
                $scope.$watch($attrs.mathjax, function(value) {

                    $element.html($sanitize(value));

                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, $element[0]]);
                });
            }]
        };
    });

    module.directive("markdown", function($sanitize) {
        return {
            restrict: "A",
            controller: ["$scope", "$element", "$attrs", function($scope, $element, $attrs) {
                $scope.$watch($attrs.markdown, function(value) {

                    $element.html($sanitize(marked(value)));
                });
            }]
        };
    });

    module.directive("sanitizedHtml", function($sanitize) {
        return {
            restrict: "A",
            controller: ["$scope", "$element", "$attrs", function($scope, $element, $attrs) {
                $scope.$watch($attrs.sanitizedHtml, function(value) {

                    $element.html($sanitize(value));
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
