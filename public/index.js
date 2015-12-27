"use strict";

// first thing to actually be run in the app
require([
    'angular',
    'domReady',
    'angular-route',
    'angular-ui-router',
    'angular-sanitize',
    'angular-bootstrap',
    'angular-dialog-service',
    'angular-simple-logger',
    'angular-google-maps',
    'apifactory',
    'common',
    'user',
    'file',
    'profile',
    'account',
    'receipt',
    'service'
], function(
    angular,
    domReady) {

    // create the root entry point to the application
    var app = angular.module('app', [
        'ngRoute',
        'ui.bootstrap',
        'ui.router',
        'apifactory',
        'common',
        'user',
        'profile',
        'account',
        'receipt',
        'file',
        'ngSanitize',
        'uiGmapgoogle-maps',
        'service'
    ]).config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){
        $urlRouterProvider.otherwise('/');

        $stateProvider
            .state('home', {
                url : '/',
                template : 'home'
            });

    }]);

    app.controller('MainCtrl', ['$scope', function ($scope) {
        $scope.admin = {
            requireEmailConfirmation : false,
            enablePasswordReset : false,
            requireAgreement : false,
        }

        $scope.title = "Hello World.";
        $scope.loadingClass = "hide";
        $scope.mainClass = "show";
    }]);

    // wait for the entire dom to be loaded before trying to run angular modules
    // there is no ng-app directive, so no angular modules are loaded or run
    domReady(function () {
        // now that dom is ready, start the angular app
        // however, since angular doesn't use ng-app, we have to tell it what
        // module to use as the root of the application
        angular.bootstrap(document, ['app']);
    });
});
