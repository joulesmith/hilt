/**
 * Module for making payments
 */

"use strict";

define(['angular', 'braintree-web'], function (angular, braintree){

    var module = angular.module('account', [])
        .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){
            $stateProvider
                .state('account', {
                    url : '/account',
                    templateUrl : 'account'
                })
                .state('account.create', {
                    url : '/create',
                    templateUrl : 'account.create',
                    controller : 'account.create'
                })
                .state('account.edit', {
                    url : '/:accountId/edit',
                    templateUrl : 'account.edit',
                    controller : 'account.edit'
                });
        }]);

    //
    // Controllers for the views of the sub-states
    //

    module.controller('account.create', ['$scope', '$window', '$state', 'apifactory.models', function($scope, $window, $state, models){

        models(['user', 'account'])
        .then(function(api){
            $scope.createAccount = function(){
                api.account.create({
                    name : $scope.name
                })
                .then(function(account){
                    $state.go('account.edit', {accountId : account._id});
                })
                .catch(function(error){
                    $scope.error = error;
                });
            };

        });

    }]);

    module.controller('account.edit', ['$scope', '$window', '$state', 'apifactory.models', function($scope, $window, $state, models){

        $scope.account = {};

        models(['user', 'account', 'service'])
        .then(function(api){
            var _id = $state.params.accountId;

            if (_id && _id !== '') {
                api.account.get(_id)
                .then(function(account){
                    angular.copy(account, $scope.account);

                    $scope.addService = function(){
                        api.service.create({
                            account : account._id,
                            name : $scope.newServiceName
                        })
                        .then(function(service){
                            $state.go('service.edit', {serviceId : service._id});
                        })
                        .catch(function(error){
                            $scope.error = error;
                        })
                    };

                    $scope.error = null;
                })
                .catch(function(error){
                    $scope.error = error;
                });
            }
        });

    }]);





    //
    // Controllers for stand-alone components
    //


    module.controller('account.search.modal', ['$scope', '$uibModalInstance', '$q', 'apifactory.models', function($scope, $uibModalInstance, $q, models){
        models('account')
        .then(function(api){
            $scope.accounts = [];
            $scope.words = '';

            $scope.search = function(){
                api.account.static.search({words : $scope.words})
                .then(function(accounts){
                    var requests = [];

                    for(var i = 0; i < profiles.length; i++) {
                        requests.push((function(i){
                            return api.account.get(accounts[i]._id)
                            .then(function(account){
                                // replace with full account data
                                accounts[i] = profile;
                            }, function(){
                                // TODO: just ignore them?
                            });
                        })(i));
                    }


                    return $q.all(requests).then(function(){
                        return accounts;
                    });
                })
                .then(function(accounts){
                    angular.copy(accounts, $scope.accounts);
                    $scope.error = null;
                }, function(error){
                    $scope.error = error;
                });
            };

            $scope.ok = function (accountId) {
              $uibModalInstance.close(accountId);
            };

            $scope.cancel = function () {
              $uibModalInstance.dismiss('cancel');
            };
        });
    }]);


});
