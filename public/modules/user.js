"use strict";

define(['angular', 'restangular'], function (angular, restangular){

    var module = angular.module('user', ['restangular'])
        .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){
            $stateProvider
                .state('user', {
                    url : '/user',
                    templateUrl : '/user.html'
                })
                .state('user.register', {
                    url : '/register',
                    templateUrl : '/user.register.html',
                    controller : 'user.register'
                })
                .state('user.login', {
                    url : '/login',
                    templateUrl : '/user.login.html',
                    controller : 'user.login'
                });
        }]);


    // apparently angular is just a global name space for dependencies anyway, so
    module.factory('user.api', ['Restangular', '$window', '$http', function(Restangular, $window, $http){

        var Auth = Restangular.all('api').all('users');

        var api = {};
        var token = null;

        api.user = {
            _id : null
        };

        /**
            Determine if user is already logged in based on expiration date in
            the token.

            @return false if not logged in, or the _id of the user in the token
        */
        api.isLoggedIn = function() {

            if (token) {
                api.user._id = token._id;
                return token._id;
            }

            token = JSON.parse($window.sessionStorage.getItem("token"));

            if (token && token.base64) {
                $http.defaults.headers.common.Authorization = token.base64;
                api.user._id = token._id;
                return token._id;
            }

            token = JSON.parse($window.localStorage.getItem("token"));

            if (token && token.base64) {
                $http.defaults.headers.common.Authorization = token.base64;
                api.user._id = token._id;
                return token._id;
            }



            $http.defaults.headers.common.Authorization = '';
            token = null;
            api.user._id = null;

            return false;
        };

        api.isLoggedIn();

        /**
            Register a new user using a email and a password.

            user must have user.email and user.password
        */
        api.register = function(user){

            return $http.post('/api/users', user);

        };

        api.setPassword = function(user, response){

            Auth.one(user.username).put({
                secret : user.secret,
                password : user.password
            })
            .then(function(data){
                response(null, data);
            }, function(error) {
                response(error);
            });
        };

        /**
            user.email
            user.password
        */
        api.login = function(user){


            return $http.post('/api/users/token', user)
                .then(function(res){

                    if (res.data.token) {
                        token = res.data.token;

                        api.user._id = token._id;

                        $http.defaults.headers.common.Authorization = token.base64;

                        if (user.rememberLogin) {
                            $window.localStorage.setItem("token", JSON.stringify(token));
                        }else{
                            $window.sessionStorage.setItem("token", JSON.stringify(token));
                        }
                    }
                });
        };

        api.logout = function(){
            token = null;
            $window.localStorage.removeItem('token');
            $window.sessionStorage.removeItem('token');
            $http.defaults.headers.common.Authorization = '';
        };

        api.passwordStrength = function(password) {

            return $http.post('/api/util/passwordStrength', {password : password});
        };

        return api;
    }]);

    module.controller('user.register', ['$scope', 'user.api', '$state', function($scope, api, $state){

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

                api.passwordStrength($scope.user.password.value)
                .then(function(res){
                    $scope.user.password.testResult = res.data;
                    var valid = res.data.strength >= 3;

                    $scope.user.password.success = valid;
                    $scope.user.password.classes.group["has-success"] = valid;
                    $scope.user.password.classes.group["has-feedback"] = valid;

                }, function(res){
                    $scope.error = res.data.error;
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
            api.register({
                email : $scope.user.email.value,
                emailConfirmation : $scope.user.emailConfirmation.value,
                password : $scope.user.password.value,
                agreeToTaC : $scope.user.agreeToTaC,
                enablePasswordReset : $scope.user.enablePasswordReset
            }).then(function(res){
                api.login({
                    email : $scope.user.email.value,
                    password : $scope.user.password.value
                }).then(function(){
                    $state.go('home');
                }, function(res){
                    if (res.data.error) {
                        $scope.error = res.data.error;
                    }
                });

            }, function(res){
                if (res.data.error) {
                    $scope.error = res.data.error;
                }
            });
        };
    }]);

    module.controller('user.login', ['$scope', 'user.api', '$state', function($scope, api, $state){

        $scope.user = {
            email : "",
            password : "",
            rememberLogin : false
        };

        $scope.submit = function () {
            api.login($scope.user)
                .then(function(res){
                    $state.go('home');
                }, function(res){
                    $scope.error = res.data.error;
                });
        };
    }]);



    module.controller('user.reset', ['$scope', 'user.api', function($scope, api){
        this.user = {
            username : "",
            password : "",
            secret : ""
        };
    }]);

    module.controller('user.welcome', ['$scope', '$state', 'user.api', function($scope, $state, api){

        $scope.api = api;

        $scope.logout = function() {
            api.logout();
            $state.go('home');
        };
    }]);

});
