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
                    return res.data.file;
                }, function(res){
                    // TODO this doesn't seem right, maybe use Error somehow?
                    throw res.data.error;
                });
        };

        api.ownedfiles = function(userid) {
            return $http.get('api/file/ownedfiles/' + userid)
                .then(function(res){

                    return res.data.file;
                }, function (res){
                    throw res.data.error
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
    module.controller('file.select', ['$scope', 'file.api', '$uibModalInstance', 'currentURL', 'apifactory.models', '$q', function($scope, file, $uibModalInstance, currentURL, models, $q){
        models(['user', 'file'])
        .then(function(api){

            $scope.updateFiles = function() {
                $scope.files = [];

                api.user.records('file')
                    .then(function(fileRecords){
                        if (fileRecords) {
                            fileRecords.id.forEach(function(file_id){
                                api.file.get(file_id)
                                .then(function(remoteFile){
                                    $scope.files.push(remoteFile);
                                });
                            });
                        }
                    })
                    .catch(function(err){
                        $scope.error = err;
                    });
            };

            $scope.updateFiles();

            $scope.upload = function() {
                file.upload($scope.localFile)
                    .then(function(remoteFile){
                        $scope.newURL = '/api/file/' + remoteFile._id + '/filename/' + remoteFile.name;
                        $scope.updateFiles();
                    })
                    .catch(function(err){
                        $scope.error = err;
                    });
            };

            $scope.selected = function(remoteFile) {
                $scope.newURL = '/api/file/' + remoteFile._id + '/filename/' + remoteFile.name;
            };

            $scope.ok = function () {
              $uibModalInstance.close($scope.newURL);
            };

            $scope.cancel = function () {
              $uibModalInstance.dismiss('cancel');
            };
        });

        $scope.newURL = currentURL;

    }]);

});
