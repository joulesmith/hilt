"use strict";

define(['angular', 'restangular'], function (angular, restangular){

    var module = angular.module('user', ['restangular']);


    // apparently angular is just a global name space for dependencies anyway, so
    module.factory('user.auth', ['Restangular', '$window', '$http', function(Restangular, $window, $http){

        var Auth = Restangular.all('api').all('users');

        var auth = {};
        var token_location = 'broadsword_token_location';

        var saveToken = function (token){

            $window.localStorage[token_location] = {
                token : token,
                base64 : (new Buffer(JSON.stringify(token), 'utf8')).toString('base64')
            };
        };

        var removeToken = function() {
            $window.localStorage.removeItem(token_location);
        }

        auth.getToken = function(){
            return $window.localStorage[token_location];
        };

        /**
            Determine if user is already logged in based on expiration date in
            the token.

            @return false if not logged in, or the _id of the user in the token
        */
        auth.isLoggedIn = function() {
            var token = $window.localStorage[token_location];

            if(token){
                // if expiration in the future, still valid
                if (token.expiration > Date.now()){
                    return payload._id;
                }
            }

            return false;
        };

        /**
            Register a new user using a email and a password.

            user must have user.username and user.email
        */
        auth.register = function(user){

            return $http.post('/api/users', user);

        };

        auth.setPassword = function(user, response){

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
            user.username
            user.password
        */
        auth.login = function(user, response){

            Auth.one(user.username).get({password : user.password})
            .then(function(data){
                saveToken(data.token);
                response(null, data);
            }, function(error) {
                response(error);
            });
        };

        auth.logout = function(){
            removeToken();
        };

        auth.passwordStrength = function(password, callback) {

            return $http.post('/api/util/passwordStrength', {password : password});
        };

        return auth;
    }]);

    module.controller('user.register', ['$scope', 'user.auth', '$state', function($scope, auth, $state){

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
                    score              : 0
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

                auth.passwordStrength($scope.user.password.value)
                .then(function(res){
                    $scope.user.password.testResult = res.data;
                    var valid = res.data.strength >= 3;

                    $scope.user.password.success = valid;
                    $scope.user.password.classes.group["has-success"] = valid;
                    $scope.user.password.classes.group["has-feedback"] = valid;

                }, function(data){

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

        $scope.classes = {
            username : "",
            email : "",
            agreeToTaC : false,
        };

        $scope.auth = auth;

        $scope.response = function(res) {
            if (res.data.error) {
                $scope.error = res.data.error;
            }
        };

        $scope.submit = function () {
            $state.go('home');
        }
    }]);

    module.controller('user.login', ['$scope', 'user.auth', function($scope, auth){
        var ctrl = this;

        ctrl.user = {
            username : "",
            password : ""
        };

        ctrl.auth = auth;

        ctrl.response = function(err) {
            if (err) {
                ctrl.error = err;
            }
        };
    }]);



    module.controller('user.reset', ['$scope', 'user.auth', function($scope, auth){
        this.user = {
            username : "",
            password : "",
            secret : ""
        };

        this.auth = auth;

        this.response = function(res) {
            if (res.data.error) {
                this.error = res.data.error;
            }
        };
    }]);

});
