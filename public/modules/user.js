"use strict";

define(['angular'], function (angular){

    // module for grouping common interactions with the user model
    var module = angular.module('user', [])
        .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){
            $stateProvider
                .state('user', {
                    url : '/user',
                    templateUrl : 'user'
                })
                .state('user.register', {
                    url : '/register',
                    templateUrl : 'user.register',
                    controller : 'user.register'
                })
                .state('user.login', {
                    url : '/login',
                    templateUrl : 'user.login',
                    controller : 'user.login'
                });
        }]);

    // create a new user
    module.controller('user.register', ['$scope', '$state', 'apifactory.models', function($scope, $state, models){
        models('user')
        .then(function(api){
            $scope.user = {
                email : {
                    value : "",
                    success : false,
                    classes : {
                        group : {
                            "has-success" : false,
                            "has-feedback" : true
                        }
                    }
                },
                emailConfirmation : {
                    value : "",
                    success : false,
                    classes : {
                        group : {
                            "has-success" : false,
                            "has-feedback" : false
                        },
                    }
                },
                password : {
                    value : "",
                    success : false,
                    classes : {
                        group : {
                            "has-success" : false,
                            "has-feedback" : false
                        },
                    },
                    testResult : {
                        strength : 0,
                        crackTime : 'less than a second'
                    }
                },
                passwordConfirm : {
                    value : "",
                    success : false,
                    classes : {
                        group : {
                            "has-success" : false,
                            "has-feedback" : false
                        },
                    }
                },
                agreeToTaC : false,
                enablePasswordReset : false
            };

            //var email_regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
            //
            var email_regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|museum)\b/;

            $scope.validate = {
                email : function() {
                    var valid = email_regex.test($scope.user.email.value);

                    $scope.user.email.success = valid;
                    $scope.user.email.classes.group["has-success"] = valid;
                    $scope.user.email.classes.group["has-feedback"] = valid;
                },
                emailConfirmation : function() {

                    var valid = true;

                    $scope.user.emailConfirmation.success = valid;
                    $scope.user.emailConfirmation.classes.group["has-success"] = valid;
                    $scope.user.emailConfirmation.classes.group["has-feedback"] = valid;
                },
                password : function() {
                    //var result = owasp.test($scope.user.password.value);

                    api.user.passwordStrength($scope.user.password.value)
                    .then(function(result){
                        $scope.user.password.testResult = result;
                        var valid = result.strength >= 3;

                        $scope.user.password.success = valid;
                        $scope.user.password.classes.group["has-success"] = valid;
                        $scope.user.password.classes.group["has-feedback"] = valid;

                    })
                    .catch(function(error){
                        $scope.error = error;
                    });


                },
                passwordConfirm : function() {

                    var valid = $scope.user.password.value !== '' && $scope.user.password.value === $scope.user.passwordConfirm.value;

                    $scope.user.passwordConfirm.success = valid;
                    $scope.user.passwordConfirm.classes.group["has-success"] = valid;
                    $scope.user.passwordConfirm.classes.group["has-feedback"] = valid;
                },
            };

            $scope.allowRegister = function() {
                if ($scope.user.email.success && (!$scope.requireEmailConfirmation || user.emailConfirmation.success)) {
                    if ($scope.user.password.success && $scope.user.passwordConfirm.success) {
                        if (!$scope.admin.requireAgreement || $scope.user.agreeToTaC) {
                            return true;
                        }
                    }
                }

                return false;
            };

            $scope.submit = function () {
                api.user.register({
                    email : $scope.user.email.value,
                    emailConfirmation : $scope.user.emailConfirmation.value,
                    password : $scope.user.password.value,
                    agreeToTaC : $scope.user.agreeToTaC,
                    enablePasswordReset : $scope.user.enablePasswordReset
                })
                .then(function(user){
                    return api.user.login({
                        email : $scope.user.email.value,
                        password : $scope.user.password.value
                    });
                })
                .then(function(){
                    $state.go('home');
                })
                .catch(function(error){
                    $scope.error = error;
                });
            };
        });

    }]);

    //
    // These are controllers for the views of sub-states of the same name
    //

    // user login
    module.controller('user.login', ['$scope', '$state', 'apifactory.models', function($scope, $state, models){
        models('user')
        .then(function(api){
            $scope.user = {
                email : "",
                password : "",
                rememberLogin : false
            };

            $scope.submit = function () {
                api.user.login($scope.user)
                .then(function(res){
                    $state.go('home');
                })
                .catch(function(error){
                    $scope.error = error;
                });
            };
        });

    }]);


    // user password reset
    module.controller('user.reset', ['$scope', 'apifactory.models', function($scope, models){
        models('user')
        .then(function(api){

        });
    }]);

    //
    // These are controllers for stand-alone components dealing with a user.
    //

    // light-weight user controls
    module.controller('user.welcome', ['$scope', '$state', 'apifactory.models', function($scope, $state, models){
        models('user')
        .then(function(api){
            $scope.api = api;
            //TODO: add login modal
            $scope.logout = function() {
                api.user.logout();
            };
        });
    }]);

});
