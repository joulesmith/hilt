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
        .then(function(api){
            $scope.receipt = {};

            $scope.validReceipt = function(receipt){
                if (receipt.amount !== 0) {
                    return false;
                }

                return true;
            };

            $scope.create = function(receipt){
                api.receipt.create(receipt)
                .then(function(receipt){
                    $state.go('receipt.view', {receiptId : receipt._id});
                });
            };

            $scope.selectAccount = function() {
                $uibModal.open({
                    animation: true,
                    templateUrl: 'account.search.modal',
                    controller: 'account.search.modal',
                    size: null,
                    resolve: {

                    }
                })
                .result
                .then(function(accountId) {
                    $scope.receipt.to = accountId;
                });
            };
        });

        $scope.formatCurrency = formatCurrency;

    }]);

    module.controller('receipt.view', ['$scope', '$state', '$uibModal', 'apifactory.models', function($scope, $state, $uibModal, models){

        models(['receipt'])
        .then(function(api){

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
                    templateUrl: 'receipt.payment.modal',
                    controller: 'receipt.payment.modal',
                    size: null,
                    resolve: {
                        receipt_id : function(){
                            return _id;
                        }
                    }
                });

                modalInstance.result
                .then(function() {
                });
            };
        });

    }]);

    module.controller('receipt.payment.modal', ['$scope', '$uibModalInstance', 'apifactory.models', 'receipt_id', function($scope, $uibModalInstance, models, receipt_id){
        models(['receipt'])
        .then(function(api){
            var checkout = null;
            $scope.receipt = {};

            api.receipt.get(receipt_id)
            .then(function(receipt){
                angular.copy(receipt, $scope.receipt);
            })
            .return(api.receipt.static.clientToken())
            .then(function(clientToken){
                return $q(function(resolve, reject){
                    // no way to primisfy this so just have to make promise manually
                    braintree.setup(clientToken, "custom", {
                        onReady: function(integration) {
                            // really ought to happen before anything else.
                            checkout = integration;
                        },
                        onPaymentMethodReceived: function(payload) {
                            resolve(payload);
                        },
                        onError: function(error) {
                            // will have to restart braintree automatically
                            // otherwise they will have to close and re-open
                            // modal
                            reject(error);
                        },
                        id: "my-sample-form",
                        hostedFields: {
                            number: {
                                selector: "#card-number",
                                placeholder: 'Card Number'
                            },
                            cvv: {
                                selector: "#cvv",
                                placeholder: 'cvv'
                            },
                            expirationDate: {
                                selector: "#expiration-date",
                                placeholder: 'mm/yyyy'
                            },
                            styles: {
                                // Style all elements
                                "input": {
                                    "font-size": "14px",
                                    "color": "#555"
                                },
                            }
                        }
                    });
                });

            })
            .then(function(payload){
                console.log("sending payment");
                return api.receipt.unsafe.payment(receipt_id, {paymentMethod : payload})
            })
            .catch(function(error){
                $scope.error = error;
            })
        });

        $scope.formatCurrency = formatCurrency;

        $scope.ok = function () {
          $uibModalInstance.close();
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
    }]);

});
