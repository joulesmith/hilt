/**
 * Module for making payments
 */

"use strict";

define(['angular', 'braintree'], function (angular, braintree){

    var module = angular.module('account', [])
        .config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider){

        }]);


    //
    // factory to the example model api
    //
    module.factory('account.api', ['$window', '$http', '$q', function($window, $http, $q){

        var api = {};

        api.setup = function(receipt) {
            var checkout = null;

            return $http({
                    url: '/api/receipt/clientToken',
                    method: "GET"
                })
                .then(function(res){
                    return $q(function(resolve, reject){
                        // no way to primisfy this so just have to make promise manually
                        braintree.setup(res.data.clientToken, "custom", {
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
                    })
                }, function(res){
                    throw res.data.error;
                })
                .then(function(payload){
                    console.log("sending payment");
                    return $http({
                            url: '/api/receipt/' + receipt._id + '/payment',
                            method: "POST",
                            data : {paymentMethod : payload}
                        });
                })
                .then(function(res){
                    checkout.teardown(function () {
                      checkout = null;
                      // braintree.setup can safely be run again!
                      // hopefully it will finish before? Or should I really wait?
                      // would need to make a promis to do that.
                      // will angular destroy all this anyway?
                    });
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
    module.controller('account.braintree', ['$scope', 'account.api', '$uibModalInstance', function($scope, account, $uibModalInstance){

        account.setup()
            .then(function(){

            })
            .catch(function(error){
                $scope.error = error;
            })

        $scope.ok = function () {
          $uibModalInstance.close($scope.newURL);
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
    }]);

});
