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

"use strict";

require.config({
    // set base to where most modules will be located
    baseUrl : './modules',
    paths : {
        'angular' : '../lib/angular.min',
        'domReady': '../lib/domReady'
    },
    shim: {
        'angular' : {
            exports : 'angular'
        }
    }
});

// first thing to actually be run in the app
require(['angular', 'domReady'
], function(angular, domReady) {

    // create the root entry point to the application
    angular.module('app', [])
    .controller('MainCtrl', ['$scope', function ($scope) {
        $scope.greetMe = 'Hello World';
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
