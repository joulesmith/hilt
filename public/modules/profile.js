"use strict";

define(['angular'], function (angular){

    //
    // module for common interactions with the profile model
    //
    var module = angular.module('profile', [])
        .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){
            $stateProvider
                .state('profile', {
                    url : '/profile',
                    templateUrl : 'profile'
                })
                .state('profile.search', {
                    url : '/search',
                    templateUrl : 'profile.search',
                    controller : 'profile.search'
                })
                .state('profile.create', {
                    url : '/create',
                    templateUrl : 'profile.create',
                    controller : 'profile.create'
                })
                .state('profile.view', {
                    url : '/:profileId',
                    templateUrl : 'profile.view',
                    controller : 'profile.view'
                });
        }]);

    // this is to ensure inputs are integers (not strings) when needed
    module.directive('number', function(){
        return {
            require: 'ngModel',
            link: function(scope, ele, attr, ctrl){
                ctrl.$parsers.unshift(function(viewValue){
                    return Number(viewValue);
                });
            }
        };
    });

    //
    // factory to the profile model api
    //
    module.factory('profile.api', ['$window', '$http', '$q', function($window, $http, $q){

        var api = {};

        api.getProfile = function(_id, profile) {

            return $http.get('/api/profile/' + _id)
                .then(function(res){

                    if (res.data.profile) {
                        angular.copy(res.data.profile[0], profile);
                    }

                    return profile;
                })
                .catch(function(res){
                    // TODO: this doesn't seem right, maybe use Error somehow?
                    throw res.data.error;
                });
        };

        api.saveProfile = function(_id, profile) {
            return $http.post('/api/profile/' + _id, profile)
                .then(function(res){
                    return profile;
                })
                .catch(function(res){
                    // TODO: this doesn't seem right, maybe use Error somehow?
                    throw res.data.error;
                });
        };

        api.createProfile = function(name) {
            return $http.post('/api/profile/', {name : name})
                .then(function(res){
                    return res.data.profile[0];
                })
                .catch(function(res){
                    // TODO: this doesn't seem right, maybe use Error somehow?
                    throw res.data.error;
                });
        };

        api.search = function(words) {
            return $http({
                    url: '/api/profile/search',
                    method: "GET",
                    params: {
                        words: words
                    }
                })
                .then(function(res) {
                    var profiles = [];
                    var requests = [];

                    for(var i = 0; i < res.data.profile.length; i++) {
                        requests.push((function(i){
                            return $http({
                                url: '/api/profile/' + res.data.profile[i]._id,
                                method: "GET"
                            }).then(function(res){
                                profiles[i] = res.data.profile[0];
                            }, function(){
                                // TODO: just ignore them?
                            });
                        })(i));
                    }


                    return $q.all(requests).then(function(){
                        return profiles;
                    });
                })
                .catch(function(res) {
                    throw res.data.error;
                });
        };

        return api;
    }]);

    //
    // Controllers for the views of the sub-states of the same name
    //

    // search for profiles
    module.controller('profile.search', ['$scope', '$state', 'profile.api', function($scope, $state, api){
        $scope.profiles = [];
        $scope.words = '';
        $scope.search = function(){
            api.search($scope.words)
            .then(function(profiles){
                angular.copy(profiles, $scope.profiles);
                $scope.error = null;
            }, function(error){
                $scope.error = error;
            });
        };
    }]);

    // view a single profile
    module.controller('profile.view', ['$scope', '$state', 'profile.api', 'user.api', function($scope, $state, api, user){
        var _id = $state.params.profileId;

        $scope.user = user;

        $scope.profile = {
            data : ""
        };

        $scope.element = {
            rows : []
        };

        $scope.status = {
            edit : false
        };

        $scope.isCollapsed = true;

        $scope.allowed = [
            {
                name : 'row',
                make : function() {
                    return {
                        elements : []
                    };
                }
            }
        ];

        $scope.addRow = function(index) {

            if (typeof index !== 'undefined') {
                $scope.element.rows.splice(index, 0, {
                    elements : []
                })
            }else{
                $scope.element.rows.push({
                    elements : []
                });
            }
        };

        $scope.addRowTo = function(column, index) {

            if (typeof index !== 'undefined') {
                column.rows.splice(index, 0, {
                    elements : []
                })
            }else{
                column.rows.push({
                    elements : []
                });
            }
        };

        $scope.deleteRow = function(index) {
            $scope.element.rows.splice(index, 1);
        }

        $scope.moveUp = function(column, index) {
            if (index > 0) {
                var tmp = column.rows[index];
                column.rows[index] = column.rows[index - 1];
                column.rows[index - 1] = tmp;
            }
        };

        $scope.moveDown= function(column, index) {
            if (index < column.rows.length - 1) {
                var tmp = column.rows[index];
                column.rows[index] = column.rows[index + 1];
                column.rows[index + 1] = tmp;
            }
        };

        $scope.moveLeft = function(row, index) {
            if (row.elements[index].offset > 0) {
                row.elements[index].offset--;
                if (index < row.elements.length - 1) {
                    row.elements[index + 1].offset++;
                }
            }else if (index > 0) {
                var tmp_element = row.elements[index];
                tmp_element.offset = row.elements[index - 1].offset;
                row.elements[index - 1].offset = 0;
                row.elements[index] = row.elements[index - 1];
                row.elements[index - 1] = tmp_element;
            }
        };

        $scope.moveRight= function(row, index) {
            var offset = 0.0;
            for(var i = 0; i < index; i++) {
                offset += row.elements[i].offset + row.elements[i].width;
            }

            if (index === row.elements.length - 1) {
                if (row.elements[index].offset < 12 - row.elements[index].width - offset) {
                    row.elements[index].offset++;
                }
            }else if (row.elements[index + 1].offset > 0) {
                row.elements[index].offset++;
                row.elements[index + 1].offset--;
            }else {
                var tmp_element = row.elements[index];

                row.elements[index] = row.elements[index + 1];
                row.elements[index].offset = tmp_element.offset;
                tmp_element.offset = 0;
                row.elements[index + 1] = tmp_element;
            }
        };

        $scope.changeWidth= function(row, index) {

        };

        $scope.addTextTo = function(row) {
            row.elements.push({
                type : 'profile.text',
                text : '',
                format : 'Default',
                offset : 0,
                width : 1
            });
        };

        $scope.addImageTo = function(row) {
            row.elements.push({
                type : 'profile.image',
                src : '',
                alt : '',
                offset : 0,
                width : 1
            });
        };

        $scope.addTitleTo = function(row) {
            row.elements.push({
                type : 'profile.title',
                offset : 0,
                width : 1
            });
        };

        $scope.addPaymentTo = function(row) {
            row.elements.push({
                type : 'profile.payment',
                offset : 0,
                width : 1
            });
        };

        $scope.addColumnTo = function(row) {
            row.elements.push({
                type : 'profile.column',
                rows : [],
                offset : 0,
                width : 1
            });
        };

        $scope.clipboard = null;
        $scope.clipboard_rows = null;

        $scope.cutElement = function(row, index) {
            if (index < row.elements.length - 1) {
                row.elements[index + 1].offset += row.elements[index].offset + row.elements[index].width;
            }

            $scope.clipboard = row.elements[index];
            row.elements.splice(index, 1);
        };

        $scope.pasteElement = function(row) {
            if ($scope.clipboard) {
                $scope.clipboard.offset = 0;
                row.elements.push($scope.clipboard);
                $scope.clipboard = null;
            }
        };

        $scope.cutRow = function(column, index) {
            $scope.clipboard_rows = column.rows[index];
            column.rows.splice(index, 1);
        };

        $scope.pasteRow = function(column) {
            if ($scope.clipboard_rows) {
                column.rows.push($scope.clipboard_rows);
                $scope.clipboard_rows = null;
            }
        };

        $scope.save = function() {
            $scope.profile.data = JSON.stringify($scope.element.rows);
            api.saveProfile($scope.profile._id, $scope.profile)
            .then(function(profile){
                $scope.error = null;
            })
            .catch(function(error){
                $scope.error = error;
            });
        };

        if (_id && _id !== '') {
            api.getProfile(_id, $scope.profile)
            .then(function(profile){

                if (profile.data !== ''){
                    $scope.element.rows = JSON.parse(profile.data);
                }

                $scope.error = null;
            })
            .catch(function(error){
                $scope.error = error;
            });
        }

    }]);

    // create a new profile
    module.controller('profile.create', ['$scope', '$state', 'profile.api', function($scope, $state, api){
        $scope.name = '';

        $scope.submit = function() {
            api.createProfile($scope.name)
            .then(function(profile){
                $scope.error = null;
                $state.go('profile.view', {profileId : profile._id});
            })
            .catch(function(error){
                $scope.error = error;
            });
        };
    }]);

    module.controller('profile.row', ['$scope', function($scope){
        $scope.isCollapsed = true;

    }]);

    //
    // Controllers for stand-alone components used for viewing profile information
    //

    module.controller('profile.column', ['$scope', function($scope){



    }]);

    module.controller('profile.text', ['$scope', '$uibModal', function($scope, $uibModal){

        $scope.edit = function() {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'profile.textEdit',
                controller: 'profile.textEdit',
                size: 'lg',
                resolve: {
                    textElement: function() {
                        return $scope.element;
                    }
                }
            });

            modalInstance.result
            .then(function(element) {
                $scope.element = element;
            });
        };
    }]);


    // example component view controller
    module.controller('profile.textEdit', ['$scope', 'file.api', '$uibModalInstance', 'textElement', 'user.api', function($scope, file, $uibModalInstance, textElement, user){

        $scope.textElement = textElement;

        $scope.formats = {
            Default : "Default",
            MathJaxMarkdown : "Markdown + LaTeX",
            Markdown : "Markdown",
            MathJax : "LaTeX",
            Preformatted : "Code",
            HTML : "HTML"
        };

        $scope.ok = function () {
          $uibModalInstance.close($scope.textElement);
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
    }]);

    module.controller('profile.image', ['$scope', '$uibModal', function($scope, $uibModal){

        $scope.select = function() {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'file.select',
                controller: 'file.select',
                size: null,
                resolve: {
                    currentURL: function() {
                        return $scope.element.src;
                    }
                }
            });

            modalInstance.result
            .then(function(newURL) {
                $scope.element.src = newURL;
            });
        };

    }]);

    module.controller('profile.title', ['$scope', '$uibModal', function($scope, $uibModal){

    }]);

    module.controller('profile.payment', ['$scope', '$uibModal', function($scope, $uibModal){

        $scope.payment = function() {
            console.log('trying to pay');
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'account.braintree',
                controller: 'account.braintree',
                size: null,
                resolve: {
                }
            });

            modalInstance.result
            .then(function() {
            });
        };

    }]);
});
