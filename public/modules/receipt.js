"use strict";

define(['angular'], function (angular){

    //
    // module for common interactions with the profile model
    //
    var module = angular.module('receipt', [])
        .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){

            $stateProvider
                .state('receipt', {
                    url : '/receipt',
                    templateUrl : 'receipt'
                })
                .state('receipt.create', {
                    url : '/create',
                    templateUrl : 'receipt.create',
                    controller : 'receipt.create'
                })
                .state('receipt.view', {
                    url : '/:receiptId',
                    templateUrl : 'receipt.view',
                    controller : 'receipt.view'
                });
        }]);

    var formatCurrency = function(number) {
        return (new Number(number)).toLocaleString({ style: 'currency', currency: 'US' })
    };

    module.controller('receipt.create', ['$scope', '$state', '$uibModal', 'apifactory.models', function($scope, $state, $uibModal, models){
        models(['receipt'])
        .then(funcion(api){

        });

        $scope.formatCurrency = formatCurrency;

    }]);

    module.controller('receipt.view', ['$scope', '$state', '$uibModal', 'apifactory.models', function($scope, $state, $uibModal, models){

        models(['receipt'])
        .then(funcion(api){

            var _id = $state.params.receiptId;
            $scope.receipt = {};
            $scope.payments = [];

            $scope.formatStatus = function(status){
                if (status === 'authoried'){
                    return "Authorized";
                }

                if (status === 'submitted_for_settlement' || status === 'settling' || status === 'settlement_pending'){
                    return "Pending";
                }

                if (status === 'settled') {
                    return "Settled";
                }

                return status;
            };

            $scope.formatCurrency = formatCurrency;

            $scope.formatDate = function(string) {
                return string;
            };

            if (_id && _id !== '') {
                api.receipt.get(_id)
                .then(function(receipt){

                    angular.copy(receipt, $scope.receipt)
                    $scope.error = null;
                })
                .catch(function(error){
                    $scope.error = error;
                });

                api.receipt.safe.paymentStatus(_id)
                .then(function(status){
                    for(var prop in status) {
                        status[prop].payments.forEach(function(element){
                            $scope.payments.push({
                                id : element.id,
                                created : $scope.formatDate(element.created),
                                status : $scope.formatStatus(prop),
                                amount : $scope.formatCurrency(element.amount)
                            })
                        });
                    }
                }).catch(function(error){
                    $scope.error = error;
                });
            }

            $scope.payment = function() {

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
        });

    }]);


});
