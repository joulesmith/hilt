/**
 * Module used for uploading files from a local computer to the server.
 */

"use strict";

define(['angular'], function (angular){

    var module = angular.module('file', [])
        .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){

        }]);

    // https://uncorkedstudios.com/blog/multipartformdata-file-upload-with-angularjs
    module.directive('fileModel', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var model = $parse(attrs.fileModel);
                var modelSetter = model.assign;

                element.bind('change', function(){
                    scope.$apply(function(){
                        modelSetter(scope, element[0].files[0]);
                    });
                });
            }
        };
    }]);

    //
    // factory to the example model api
    //
    module.factory('file.api', ['$window', '$http', function($window, $http){

        var api = {};


        // https://uncorkedstudios.com/blog/multipartformdata-file-upload-with-angularjs
        api.upload = function(file) {
            var form = new FormData();

            form.append('file', file);

            return $http.post('/api/file/', form, {
                    transformRequest : angular.identity,
                    headers : {'Content-Type' : undefined} // will be set automatically?
                })
                .then(function(res){
                    return res.data.file[0];
                }, function(res){
                    // TODO this doesn't seem right, maybe use Error somehow?
                    throw res.data.error;
                });
        };


        return api;
    }]);

    //
    // Controllers for the views of the sub-states
    //



    //
    // Controllers for stand-alone components
    //

    // example component view controller
    module.controller('file.upload', ['$scope', 'file.api', '$uibModalInstance', function($scope, api, $uibModalInstance){
        $scope.submit = function() {
            api.upload($scope.localFile)
                .then(function(file){
                    $scope.remoteFile = file;
                })
                .catch(function(err){
                    $scope.error = err;
                });
        };

        $scope.ok = function () {
          $uibModalInstance.close($scope.remoteFile);
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
    }]);

});
