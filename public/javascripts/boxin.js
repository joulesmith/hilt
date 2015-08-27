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



define([
    'angular',
    'ui-bootstrap',
    'dnd'
], function (angular){
    "use strict";

    var app = angular.module('boxin', ['ui.bootstrap', 'dndLists']);

    app.controller('MainCtrl', [
        '$scope', '$timeout',
        function($scope, $timeout){

            $scope.status = {};

            $scope.categories = {
                element : ['boolean', 'number', 'string', 'null'],
                structure : ['array', 'object', 'variable', 'reference','function', 'evaluate'],
                control : ['assign', 'return', 'if-else', 'while', 'for', 'for-in', 'javascript'],
                keyable : ['variable', 'number', 'string', 'reference', 'evaluate'],
                functionable : ['function', 'variable', 'evaluate', 'reference'],
                assignable : ['reference', 'variable']
            }

            $scope.cat_array = ['element', 'structure', 'control'];

            $scope.types = {
                boolean : function(list) {
                    list.push({
                        type: 'boolean',
                        value : false
                    });
                },
                number : function(list) {
                    list.push({
                        type: 'number',
                        value : 0
                    });
                },
                string : function(list) {
                    list.push({
                        type: 'string',
                        value : "temp"
                    });
                },
                null : function(list) {
                    list.push({
                        type: 'null'
                    });
                },
                array : function(list) {
                    list.push({
                        type: 'array',
                        arr : []
                    });
                },
                object : function(list) {
                    list.push({
                        type: 'object',
                        properties : []
                    });
                },
                property : function(list) {
                    list.push({
                        type: 'property',
                        name : [],
                        value : []
                    });
                },
                variable : function(list) {
                    list.push({
                        type: 'variable',
                        name : "tmp"
                    });
                },
                reference : function(list) {
                    list.push({
                        type: 'reference',
                        object : [],
                        prop : []
                    });
                },
                function : function(list) {
                    list.push({
                        type: 'function',
                        args : [],
                        vars : [],
                        sequence: []
                    });
                },
                evaluate : function(list) {
                    list.push({
                        type: 'evaluate',
                        variable : [],
                        args : []
                    });
                },
                assign : function(list) {
                    list.push({
                        type: 'assign',
                        variable : [],
                        value : []
                    });
                },
                return : function(list) {
                    list.push({
                        type: 'return',
                        variable : []
                    });
                },
                javascript : function(list) {
                    list.push({
                        type: 'javascript',
                        source : "source"
                    });
                }
            };


            $scope.value = [{
                type : 'assign',
                variable : [{
                    type : 'variable',
                    name : 'objName'
                }],
                value: [{
                    type : 'object',
                    properties : [
                        {
                            type: 'property',
                            name: [{type: 'string', value: 'x'}],
                            value:  [{
                                type : 'number',
                                value : 5
                            }]
                        },
                        {
                            type: 'property',
                            name: [{type: 'string', value: 'asd'}],
                            value:  [{
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
                                            variable : [{
                                                type: 'variable',
                                                name : 'y'
                                            }],
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
                            }]
                        },
                        {
                            type: 'property',
                            name: [{type: 'string', value: 'another'}],
                            value:  [{
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
                        },
                        {
                            type: 'property',
                            name: [{type: 'string', value: 'fourth'}],
                            value:  []
                        },
                    ]

                }]
            }];

    }]);

    return app;
});
