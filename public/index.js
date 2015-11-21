"use strict";

require.config({
    // set base to where most modules will be located
    baseUrl : './modules',
    paths : {
        'angular' : '../lib/angular.min',
        'domReady': '../lib/domReady',
        'lodash' : '../lib/lodash.min',
        'restangular' : '../lib/restangular',
        'ui-router' : '../lib/angular-ui-router.min',
        'ui-bootstrap' : '../lib/ui-bootstrap.min'
    },
    shim: {
        'angular' : {
            exports : 'angular'
        },
        'lodash' : {
            exports : '_'
        },
        'restangular' : {
            deps: ['lodash'],
            exports : 'restangular'
        },
        'ui-bootstrap' : {
            deps: ['angular'],
            exports : 'ui-bootstrap'
        },
        'ui-router' : {
            deps: ['angular'],
            exports : 'ui-router'
        }
    }
});

// first thing to actually be run in the app
require([
    'angular',
    'domReady',
    'user',
    'common',
    'ui-bootstrap',
    'ui-router'
], function(
    angular,
    domReady) {

    // create the root entry point to the application
    var app = angular.module('app', [
        'common',
        'user',
        'ui.bootstrap',
        'ui.router'
    ]).config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){
        $urlRouterProvider.otherwise('/');

        $stateProvider.state('home', {
            url : '/',
            template : 'home'
        }).state('user_register', {
            url : '/user/register',
            templateUrl : '/user/register.html'
        });
    }]);

    app.controller('MainCtrl', ['$scope', function ($scope) {
        $scope.admin = {
            requireEmailConfirmation : true,
            enablePasswordReset : true,
            requireAgreement : true,
        }

        $scope.title = "Hello World.";
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
