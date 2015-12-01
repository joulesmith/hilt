"use strict";

require.config({
    // set base to where most modules will be located
    baseUrl : './modules',
    paths : {
        'angular' : '../lib/angular.min',
        'ngRoute' : '../lib/angular-route.min',
        'domReady': '../lib/domReady',
        'lodash' : '../lib/lodash.min',
        'restangular' : '../lib/restangular',
        'uiRouter' : '../lib/angular-ui-router.min',
        'uiBootstrap' : '../lib/ui-bootstrap-tpls-0.14.3.min',
        'marked' : '../lib/marked'
    },
    shim: {
        'angular' : {
            exports : 'angular'
        },
        'ngRoute' : {
            deps: ['angular'],
            exports : 'ngRoute'
        },
        'uiRouter' : {
            deps: ['angular']
        },
        'uiBootstrap' : {
            deps: ['angular']
        },
        'lodash' : {
            exports : '_'
        },
        'restangular' : {
            deps: ['angular', 'lodash'],
            exports : 'restangular'
        }
    }
});

// first thing to actually be run in the app
require([
    'angular',
    'domReady',
    'ngRoute',
    'user',
    'common',
    'file',
    'profile',
    'uiBootstrap',
    'uiRouter'
], function(
    angular,
    domReady) {

    // create the root entry point to the application
    var app = angular.module('app', [
        'ngRoute',
        'ui.bootstrap',
        'ui.router',
        'common',
        'user',
        'profile',
        'file'
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
