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

    var validNumber = /[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/;
    var validName = /^[$A-Z_][0-9A-Z_$]*$/i;
    var reserved = {
      'do':true,
      'if':true,
      'in':true,
      'for':true,
      'let':true,
      'new':true,
      'try':true,
      'var':true,
      'case':true,
      'else':true,
      'enum':true,
      'eval':true,
      'null':true,
      'this':true,
      'true':true,
      'void':true,
      'with':true,
      'await':true,
      'break':true,
      'catch':true,
      'class':true,
      'const':true,
      'false':true,
      'super':true,
      'throw':true,
      'while':true,
      'yield':true,
      'delete':true,
      'export':true,
      'import':true,
      'public':true,
      'return':true,
      'static':true,
      'switch':true,
      'typeof':true,
      'default':true,
      'extends':true,
      'finally':true,
      'package':true,
      'private':true,
      'continue':true,
      'debugger':true,
      'function':true,
      'arguments':true,
      'interface':true,
      'protected':true,
      'implements':true,
      'instanceof':true
    };

    var change_var_types = {};

    change_var_types['array'] = ['arr'];
    change_var_types['object'] = ['properties'];
    change_var_types['property'] = ['value'];
    change_var_types['array'] = ['arr'];
    change_var_types['reference'] = ['object', 'prop'];
    change_var_types['evaluate'] = ['variable', 'args'];
    change_var_types['assign'] = ['variable', 'value'];
    change_var_types['return'] = ['variable'];

    var test_variable_name = function(name_from, name_to, f) {

        var test = {
            invalid : !validName.test(name_to),
            reserved : reserved[name_to],
            override_conflict : false,
            lostscope_conflict : false
        };

        if(!test.invalid && !test.reserved && name_from !== name_to){


            for(var k = 0; k < f.vars.length; k++) {
                if (f.vars[k].name === name_to) {
                    // if the new name already exists, then it will
                    // not have scope below
                    test.override_conflict = true;
                }
            }

            for(var k = 0; k < f.args.length; k++) {
                if (f.args[k].name === name_to) {
                    // if the new name already exists, then it will
                    // not have scope below
                    test.override_conflict = true;
                }
            }

            var curse = function(cur, new_scope, old_scope) {

                for(var i = 0; i < cur.length; i++) {
                    var type = cur[i].type;
                    var subs;

                    if (type === 'variable') {
                        if (new_scope && cur[i].name === name_to) {
                            // if we find a variable name with the same name already,
                            // that means they have either entered it from a higher
                            // scope then we started, or they entered it manually.
                            // if it is changed to that name then that variable will
                            // now refer to the variable changing names, instead of
                            // the one it was refering to
                            test.override_conflict = true;
                        }else if (old_scope && !new_scope && cur[i].name === name_from) {
                            // the problem is that they're trying to change the variable
                            // name to the same name as a local variable, when they've
                            // already specified a name for it. If it is changed it
                            // will now refer to the local variable instead of the
                            // one they're changing
                            test.lostscope_conflict = true;
                        }

                    }else if (type === 'function') {
                        var args = cur[i].args;

                        var check_vars = function(vars) {

                            for(var k = 0; k < vars.length; k++) {
                                if (name_from === vars[k].name){
                                    // if the old name was overriden already, then
                                    // it has no scope below
                                    old_scope = false;
                                }else if (vars[k].name === name_to) {
                                    // if the new name already exists, then it will
                                    // not have scope below
                                    new_scope = false;
                                }
                            }
                        };

                        check_vars(cur[i].args);
                        check_vars(cur[i].vars);

                        if(new_scope || old_scope) {
                            curse(cur[i].sequence, new_scope, old_scope);
                        }
                    }else if (subs = change_var_types[type]) {
                        for(var j = 0; j < subs.length; j++) {
                            curse(cur[i][subs[j]], new_scope, old_scope);
                        }
                    }
                }
            };

            curse(f.sequence, true, true);


        }

        return test;
    };


    var app = angular.module('boxin', ['ui.bootstrap', 'dndLists']);

    app.controller('MainCtrl', [
        '$scope', '$timeout',
        function($scope, $timeout){

            $scope.status = {};

            $scope.test_number = function(value) {
                if (validNumber.test(value.value_tmp)){
                    value.value = new Number(value.value_tmp);
                    value.edit=false;
                }
            };

            $scope.test_variable_name = function(variable, f) {
                var test = test_variable_name(variable.name, variable.name_tmp, f);

                if (!test.invalid && !test.reserved && !test.override_conflict && ! test.scopelost_conflict){
                    variable.name = variable.name_tmp;
                }

                return test;
            };

            $scope.categories = {
                element : ['boolean', 'number', 'string', 'null'],
                structure : ['array', 'object', 'variable', 'reference','function', 'evaluate'],
                control : ['assign', 'return', 'if', 'while', 'for', 'for-in', 'javascript'],
                keyable : ['variable', 'number', 'string', 'reference', 'evaluate'],
                functionable : ['function', 'variable', 'evaluate', 'reference'],
                assignable : ['reference', 'variable']
            }

            $scope.cat_array = ['element', 'structure', 'control'];

            $scope.types = {
                boolean : function(list) {
                    list.push({
                        type: 'boolean',
                        value : 'false'
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
                        value : "",
                        edit : true
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
                        name : ""
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
                'if' : function(list) {
                    list.push({
                        type: 'if',
                        'conditions' : [{
                            condition : [],
                            sequence : []
                        }]
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
                type: 'function',
                args : [],
                vars: [],
                sequence: [{
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
                }]
            }];

    }]);

    return app;
});
