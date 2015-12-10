/**
 * Module for making payments
 */

"use strict";

define(['angular', 'braintree'], function (angular, braintree){

    var module = angular.module('account', [])
        .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){

        }]);

    //
    // Controllers for the views of the sub-states
    //



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
