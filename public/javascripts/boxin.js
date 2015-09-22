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
    change_var_types['reference'] = ['object', 'ref'];
    change_var_types['evaluate'] = ['variable', 'args'];
    change_var_types['assign'] = ['variable', 'value'];
    change_var_types['return'] = ['variable'];

    var test_variable_name = function(name_from, name_to, current_scope) {


        var test = {
            invalid : !validName.test(name_to),
            reserved : reserved[name_to],
            override_conflict : false,
            lostscope_conflict : false
        };

        if(!test.invalid && !test.reserved && name_from !== name_to){


            for(var k = 0; k < current_scope.f.vars.length; k++) {
                if (current_scope.f.vars[k].name === name_to) {
                    // if the new name already exists, then it will
                    // not have scope below
                    test.override_conflict = true;
                }
            }

            for(var k = 0; k < current_scope.f.args.length; k++) {
                if (current_scope.f.args[k].name === name_to) {
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

            curse(current_scope.f.sequence, true, true);


        }

        return test;
    };


    var change_variable_name = function(name_from, name_to, current_scope) {

        if(name_from !== name_to){

            var curse = function(cur) {

                for(var i = 0; i < cur.length; i++) {
                    var type = cur[i].type;
                    var subs;

                    if (type === 'variable') {

                        if (cur[i].name === name_from) {

                            cur[i].name = name_to;
                        }

                    }else if (type === 'function') {
                        var old_scope = true, new_scope = true;

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

                        if(new_scope && old_scope) {
                            curse(cur[i].sequence);
                        }
                    }else if (subs = change_var_types[type]) {
                        for(var j = 0; j < subs.length; j++) {
                            curse(cur[i][subs[j]]);
                        }
                    }
                }
            };

            curse(current_scope.f.sequence);


        }

    };



    var categories = {
        element : ['boolean', 'number', 'string', 'null'],
        structure : ['array', 'object', 'variable', 'reference','function', 'evaluate'],
        control : ['assign', 'return', 'if', 'while', 'for', 'for-in', 'javascript'],
        keyable : ['variable', 'number', 'string', 'reference', 'evaluate'],
        functionable : ['function', 'variable', 'evaluate', 'reference'],
        assignable : ['reference', 'variable']
    }

    var cat_array = ['element', 'structure', 'control'];

    var types = {
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
        directory : function(list) {
            list.push({
                type: 'directory',
                name : "",
                nodes : []
            });
        },
        module_file : function(list) {
            var value = [];
            types['module'](value);

            list.push({
                type: 'module_file',
                name : "",
                value : value
            });
        },
        dependency_file : function(list) {

            list.push({
                type: 'dependency_file',
                name : ""
            });
        },
        open_file : function(list) {

            var ref = {
                type: 'open_file',
                path : '',
                file : null
            };

            list.push(ref);

            return ref;
        },
        variable : function(list) {
            list.push({
                type: 'variable',
                name : ""
            });
        },
        variable_declare : function(list) {
            list.push({
                type: 'variable_declare',
                name : ""
            });
        },
        reference : function(list) {
            list.push({
                type: 'reference',
                object : [],
                ref : []
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
        module : function(list) {
            list.push({
                type: 'module',
                dependencies: [],
                args: [],
                vars : [],
                sequence: []
            });
        },
        dependency : function(list) {
            list.push({
                type: 'dependency',
                name : "",
                path : ""
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
                'conditionals' : []
            });
        },
        'conditional' : function(list) {
            list.push({
                type: 'conditional',
                'condition' : [],
                'sequence' : []
            });
        },
        'while' : function(list) {
            list.push({
                type: 'while',
                'condition' : [],
                'sequence' : []
            });
        },
        'for' : function(list) {
            list.push({
                type: 'for',
                'initialize' : [],
                'condition' : [],
                'increment' : [],
                'sequence' : []
            });
        },
        'for-in' : function(list) {
            list.push({
                type: 'for-in',
                'variable' : [],
                'object' : [],
                'sequence' : []
            });
        },
        source : function(list) {
            list.push({
                type: 'source',
                value : "",
                edit : true
            });
        }
    };


    var app = angular.module('boxin', ['ui.bootstrap', 'dndLists'], function($rootScopeProvider){
        // so apparently Angular doesn't really like recursion. this sets the limit, the default
        // of 10 is too small for the app to initialize properly
        $rootScopeProvider.digestTtl(100);
    });

    app.controller('listctrl', [
        '$scope',
        function($scope){

			$scope.init = function(list, allowed_types){
                $scope.list = list;
                $scope.allowed_types = allowed_types;
                $scope.status = {
                    choose : false
                };
            };
	}]);

    app.controller('directory', [
        '$scope',
        function($scope){

            $scope.status = {
                view : $scope.value.name === '',
                edit : $scope.value.name === '',
                name_tmp : $scope.value.name
            };

            $scope.change_name = function() {
                $scope.value.name = $scope.status.name_tmp;
                $scope.status.edit = false;
            };

            $scope.get_path = function () {

                if ($scope.$parent.get_path) {
                    return $scope.$parent.get_path() + "/" + $scope.value.name;
                }else{
                    return "";
                }
            };

        }
    ]);

    app.controller('module_file', [
        '$scope',
        function($scope){

            $scope.status = {
                view : $scope.value.name === '',
                edit : $scope.value.name === '',
                name_tmp : $scope.value.name
            };

            $scope.change_name = function() {
                $scope.value.name = $scope.status.name_tmp;
                $scope.status.edit = false;
            };

            $scope.get_path = function () {
                return $scope.$parent.get_path() + "/" + $scope.value.name;
            };

        }
    ]);


    app.controller('dependency_file', [
        '$scope',
        function($scope){

            $scope.status = {
                view : $scope.value.name === '',
                edit : $scope.value.name === '',
                version_tmp : $scope.value.version,
                name_tmp : $scope.value.name
            };

            $scope.change_name = function() {
                $scope.value.name = $scope.status.name_tmp;
                $scope.status.edit = false;
            };

            $scope.change_version = function() {
                $scope.value.version = $scope.status.version_tmp;
                $scope.status.edit_version = false;
            };

            $scope.get_path = function () {
                return $scope.$parent.get_path() + "/" + $scope.value.name;
            };

        }
    ]);

    app.controller('open_file', [
        '$scope',
        function($scope){
            $scope.status = {};

	}]);

    app.controller('dependency', [
        '$scope',
        function($scope){

            $scope.status = {
                test : {},
                name_tmp : $scope.value.name,
                edit : $scope.value.name === '',
                path_tmp : $scope.value.path,
                edit_path : $scope.value.path === ''
            };

            if ($scope.value.path === '') {
                $scope.choose_file = function(path, var_name) {
                    $scope.value.path = path;
                    $scope.status.edit_path = false;

                    if ($scope.value.name === '') {
                        $scope.status.name_tmp = var_name;
                        $scope.change_variable();
                    }
                };
            }

            $scope.change_variable = function() {

                var test = test_variable_name($scope.value.name, $scope.status.name_tmp, $scope.current_scope);


                if (!test.invalid && !test.reserved && !test.override_conflict && ! test.lostscope_conflict){

                    change_variable_name($scope.value.name, $scope.status.name_tmp, $scope.current_scope);



                    var args = $scope.current_scope.f.args;

                    for(var index = 0; index < args.length; index++) {
                        if (args[index].name === $scope.value.name) {
                            args[index].name = $scope.status.name_tmp;
                            break;
                        }
                    }

                    if (index === args.length) {
                        types['variable'](args);
                        args[index].name = $scope.status.name_tmp;
                    }

                    $scope.value.name = $scope.status.name_tmp;

                    $scope.status.edit = false;
                }

                $scope.status.test = test;
            };

            $scope.change_path = function() {
                $scope.value.path = $scope.status.path_tmp;
                $scope.status.edit_path = false;
            };
	}]);

    app.controller('variable_declare', [
        '$scope',
        function($scope){

            $scope.status = {
                test : {},
                name_tmp : $scope.value.name,
                edit : $scope.value.name === ''
            };

            $scope.change_variable = function() {

                var test = test_variable_name($scope.value.name, $scope.status.name_tmp, $scope.current_scope);


                if (!test.invalid && !test.reserved && !test.override_conflict && ! test.lostscope_conflict){

                    change_variable_name($scope.value.name, $scope.status.name_tmp, $scope.current_scope);

                    $scope.value.name = $scope.status.name_tmp;

                    $scope.status.edit = false;
                }

                $scope.status.test = test;
            };
	}]);

    app.controller('variable', [
        '$scope',
        function($scope){

            $scope.status = {
                test : {},
                name_tmp : $scope.value.name,
                edit : $scope.value.name === ''
            };

            $scope.add_variable = function() {

                var test = test_variable_name($scope.value.name, $scope.status.name_tmp, $scope.current_scope);


                if (!test.invalid && !test.reserved && !test.override_conflict && ! test.lostscope_conflict){

                    $scope.value.name = $scope.status.name_tmp;

                    // also add it to the variables of the function
                    $scope.current_scope.f.vars.push({type: 'variable_declare', name: $scope.value.name});

                    $scope.status.edit = false;
                }

                $scope.status.test = test;
            };
	}]);

    app.controller('source', [
        '$scope',
        function($scope){

            $scope.status = {
                edit : $scope.value.value === '',
                src_tmp : $scope.value.value,
            };

            $scope.change = function() {
                $scope.value.value = $scope.status.src_tmp;
                $scope.status.edit = false;
            }

	}]);

    app.controller('null', [
        '$scope',
        function($scope){

            $scope.status = {
            };
	}]);

    app.controller('boolean', [
        '$scope',
        function($scope){

            $scope.status = {
                edit : false,
                boolean_tmp : $scope.value.value
            };


            $scope.change = function(){

                $scope.value.value = $scope.status.boolean_tmp;
                $scope.status.edit=false;
            }

	}]);

    app.controller('number', [
        '$scope',
        function($scope){


            $scope.status = {
                edit : false,
                num_tmp : $scope.value.value
            };


            $scope.test_number = function(){
                if (validNumber.test($scope.status.num_tmp)){
                    $scope.value.value = new Number($scope.status.num_tmp);
                    $scope.status.edit=false;
                }else{
                    $scope.status.error = "invalid"
                }
            }
	}]);

    app.controller('string', [
        '$scope',
        function($scope){

            $scope.status = {
                edit : $scope.value.value === '',
                str_tmp : $scope.value.value,
            };

            $scope.change = function() {
                $scope.value.value = $scope.status.str_tmp;
                $scope.status.edit = false;
            }

	}]);

    app.controller('property', [
        '$scope',
        function($scope){
            $scope.status = {};

	}]);

    app.controller('object', [
        '$scope',
        function($scope){
            $scope.status = {};
	}]);

    app.controller('array', [
        '$scope',
        function($scope){
            $scope.status = {};
	}]);

    app.controller('module', [
        '$scope',
        function($scope){
            $scope.status = {};
            $scope.current_scope = {
                f : $scope.value,
                parent_scope : null
            };

        }
    ]);

    app.controller('function', [
        '$scope',
        function($scope){
            $scope.status = {};
            $scope.current_scope = {
                f : $scope.value,
                parent_scope : $scope.current_scope
            };

        }
    ]);

    app.controller('variable_scope', [
        '$scope',
        function($scope){

            $scope.vars_list = [];
            $scope.total = 0;



            var current_scope = $scope.current_scope;

            var reserved = {};

            while(current_scope) {
                var names = current_scope.f.args.concat(current_scope.f.vars);
                var vars = [];

                for(var i = 0; i < names.length; i++) {
                    if (reserved[names[i].name]) {
                        vars.push({access: false, name: names[i].name});
                    }else{
                        reserved[names[i].name] = true;
                        vars.push({access: true, name: names[i].name});
                    }
                }

                $scope.total += vars.length;
                $scope.vars_list.push(vars);
                current_scope = current_scope.parent_scope;
            }



            $scope.is_reserved = function(name) {
                var x = reserved[name] === true;

                reserved[name] = true;

                return x;
            };

        }
    ]);

    app.controller('assign', [
        '$scope',
        function($scope){
            $scope.status = {};

	}]);

    app.controller('evaluate', [
        '$scope',
        function($scope){
            $scope.status = {};
	}]);

    app.controller('reference', [
        '$scope',
        function($scope){
            $scope.status = {};

	}]);

    app.controller('return', [
        '$scope',
        function($scope){

            $scope.status = {};
	}]);

    app.controller('conditional', [
        '$scope',
        function($scope){

            $scope.status = {};
	}]);

    app.controller('if', [
        '$scope',
        function($scope){

            $scope.status = {};
	}]);

    app.controller('while', [
        '$scope',
        function($scope){

            $scope.status = {};
	}]);

    app.controller('for', [
        '$scope',
        function($scope){
            $scope.status = {};

	}]);

    app.controller('for-in', [
        '$scope',
        function($scope){

            $scope.status = {};
	}]);

    app.controller('types', [
        '$scope',
        function($scope){

            $scope.view_types = {
            };

            for(var i = 0 ; i < $scope.allowed_types.length; i++) {
                $scope.view_types[$scope.allowed_types[i]] = true;
            }

            if ($scope.allowed_types.length > 1 || ($scope.clipboard.length > 0 && $scope.view_types[$scope.clipboard[$scope.clipboard.length-1].type])) {

            }else if ($scope.allowed_types.length === 1)
            {
                types[$scope.allowed_types[0]]($scope.list);
                $scope.status.choose = false;
            }

            $scope.add = function(type) {
                if (typeof type === 'object') {
                    $scope.list.push(type);
                    $scope.status.choose = false;
                }else{
                    types[type]($scope.list);
                    $scope.status.choose = false;
                }
            };
	}]);



    app.controller('MainCtrl', [
        '$scope', '$timeout',
        function($scope, $timeout){


            $scope.status = {};

            $scope.value = [];

            types['module']($scope.value);

            $scope.clipboard = [];

            $scope.copy = function(value) {
                $scope.clipboard.push(angular.copy(value));
            };

            $scope.cut = function(list, index) {
                $scope.clipboard.push(list[index]);
                list.splice(index, 1);

            };

            $scope.opened = [];

            $scope.open = function(value, path) {
                $scope.opened.push({
                    type: 'open_file',
                    path : path,
                    value : value
                });
            };

            $scope.close = function(of) {

                var index = $scope.opened.indexOf(of);
                $scope.opened.splice(index, 1);
            };

            var click_handled = false;
            var current_status = $scope.status;

            $scope.box_clicked = function(status) {
                if (!$scope.click_handled) {
                    current_status.view_actions = false;
                    current_status = status;
                    current_status.view_actions = true;
                    $scope.click_handled = true;
                }
            };


            var root = {
                'type' : 'directory',
                'name' : 'package',
                'nodes' : []
            };

            $scope.directory = [root];


            //$scope.value=[{"type":"module","dependencies":[],"args":[],"vars":[],"sequence":[{"type":"evaluate","variable":[{"type":"variable","name":"define"}],"args":[{"type":"array","arr":[{"type":"string","value":"angular","edit":true}]},{"type":"function","args":[{"type":"variable_declare","name":"angular"}],"vars":[{"type":"variable_declare","name":"app"}],"sequence":[{"type":"assign","variable":[{"type":"variable","name":"app"}],"value":[{"type":"evaluate","variable":[{"type":"reference","object":[{"type":"variable","name":"angular"}],"ref":[{"type":"string","value":"module","edit":true}]}],"args":[{"type":"string","value":"boxin","edit":true}]}]},{"type":"return","variable":[{"type":"variable","name":"app"}]}]}]}]}];

/*
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
*/
    }]);



    return app;
});
