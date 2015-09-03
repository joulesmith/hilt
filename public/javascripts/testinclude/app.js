define([
    'angular',
    'ui-bootstrap',
    'dnd'
], function (angular){
    "use strict";

	var app = angular.module('testinclude', ['ui.bootstrap', 'dndLists']);

    app.controller('MainCtrl', [
        '$scope', '$timeout',
        function($scope, $timeout){

			$scope.x = 1;
	}]);

    app.controller('subctrl', [
        '$scope',
        function($scope){

			$scope.set = function(obj){
                for(var prop in obj) {
                    $scope[prop] = obj[prop];
                }

            };
	}]);

	return app;
});
