/*
    Copyright (C) 2015  Joulesmith Energy Technologies, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/




"use strict";

var app = angular.module('boxin', ['ui.router']);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

        $stateProvider.state('home', {
            url: '/home',
            templateUrl: '/home.html',
            controller: 'MainCtrl',
        });

      $urlRouterProvider.otherwise('home');
}]);

app.directive(
    "boxin",
    ['$compile', '$timeout', function($compile, $timeout) {
        return {
            restrict: "E",
            replace: true,
            scope : {
                value : "="
            },
            template: "",
            link: function ($scope, $element, $attrs) {

                    if ($scope.value.is_string) {

                        $element.append("<a class='choose string' href='/#/'>{{value.value}}</a>");

                    }else if ($scope.value.is_variable) {

                        $element.append("<a class='choose variable' href='/#/'>{{value.name}}</a>");

                    }else if ($scope.value.is_number) {

                        $element.append("<a class='choose number' href='/#/'>{{value.value}}</a>");

                    }else if ($scope.value.is_boolean) {

                        $element.append("<a class='choose boolean' href='/#/'>{{value.value}}</a>");

                    }else if ($scope.value.is_assign) {
                        $element.append([
                            "<div class='assign'>",
                            "<boxin value='value.variable'></boxin>",
                            "<a class='symbol' href=''>&larr;</a>",
                            "<boxin value='value.value'></boxin>",
                            "</div>"
                        ].join(''));

                    }else if($scope.value.is_object) {

                        var template = "<div class='object_def'>";

                        for(var prop in $scope.value.props){
                            template += "<div class='parameter_def'>";
                            template += "<a class='choose string' href=''>" + prop + "</a>";
                            template += "<a class='symbol' href=''>:</a>";
                            template += "<boxin value='value.props." + prop + "'></boxin>";
                            template += "</div>";
                        }

                        template += "</div>";

                        $element.append(template);

                    }else if ($scope.value.is_evaluate) {
                        var template = "<div class='evaluate'>";
                        template += "<boxin value='value.f'></boxin>";
                        template += "<a class='symbol' href=''>()&larr;</a>";

                        for(var arg in $scope.value.args){
                            template += "<boxin value='value.args." + arg + "'></boxin>";

                        }

                        template += "</div>";

                        $element.append(template);

                    }else if ($scope.value.is_reference) {
                        $element.append([
                            "<div class='object_def'>",
                            "<boxin value='value.object'></boxin>",
                            "<a class='symbol' href=''>.</a>",
                            "<boxin value='value.prop'></boxin>",
                            "</div>"
                        ].join(''));

                    }

                    $compile($element.contents())($scope);

            }
        };
    }]
);

app.controller('MainCtrl', [
    '$scope', '$timeout',
    function($scope, $timeout){

        $scope.change = function(){

            $timeout(function() {

                $scope.value[0].props.y = [{
                    type: 'number',
                    value: 2
                }]
            });


        };

        $scope.value = [{
            type : 'assign',
            variable : {
                type : 'variable',
                name : 'objName'
            },
            value: [{
                type : 'object',
                props : {
                    x : [{
                        type : 'number',
                        value : 5
                    }],
                    asd : [{
                        type : 'evaluate',
                        variable : [{
                            type : 'function',
                            args : [{
                                type : 'variable',
                                name : 'x'
                            }],
                            vars : [{
                                type : 'variable',
                                name : 'y'
                            }],
                            sequence : [
                                {
                                    type : 'assign',
                                    variable : {
                                        type: 'variable',
                                        name : 'y'
                                    },
                                    value : [{
                                        type : 'string',
                                        value : 'myString'
                                    }]
                                },
                                {
                                    type : 'return',
                                    variable : [{
                                        type : 'variable',
                                        name : 'y'
                                    }]
                                }
                            ]
                        }],
                        args : [{
                            type : 'number',
                            value : 3
                        }]
                    }],
                    another : [{
                        type : 'array',
                        arr : [
                            {
                                type : 'string',
                                value : 'some stuff'
                            },
                            {
                                type : 'string',
                                value : 'other stuff'
                            }
                        ]
                    }]
                }
            }]
        }];

}]);
