"use strict";

define('user', ['angular'], function (angular){

    var module = angular.module('user', [])
        .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){
            $stateProvider
                .state('user', {
                    url : '/user',
                    templateUrl : 'user'
                })
                .state('user.register', {
                    url : '/register',
                    templateUrl : 'user/register.html',
                    controller : 'user.register'
                })
                .state('user.login', {
                    url : '/login',
                    templateUrl : 'user/login.html',
                    controller : 'user.login'
                });
        }]);
});
