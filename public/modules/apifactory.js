"use strict";

define(['angular'], function (angular){

    //
    // module for common interactions with the profile model
    //
    var module = angular.module('apifactory', []);


    //
    // factory to the profile model api
    //
    module.factory('apifactory.models', ['$window', '$http', '$q', function($window, $http, $q){

        var api = {};

        var token = null;
        api.user = {};
        api.user._id = null;

        /**
            Determine if user is already logged in based on expiration date in
            the token.

            @return false if not logged in, or the _id of the user in the token
        */
        api.user.isLoggedIn = function() {

            if (token) {
                api.user._id = token._id;
                return token._id;
            }

            token = JSON.parse($window.sessionStorage.getItem("token"));

            if (token && token.base64) {
                $http.defaults.headers.common.Authorization = token.base64;
                api.user._id = token._id;
                return token._id;
            }

            token = JSON.parse($window.localStorage.getItem("token"));

            if (token && token.base64) {
                $http.defaults.headers.common.Authorization = token.base64;
                api.user._id = token._id;
                return token._id;
            }



            $http.defaults.headers.common.Authorization = '';
            token = null;
            api.user._id = null;

            return false;
        };

        api.user.isLoggedIn();

        /**
            Register a new user using a email and a password.

            user must have user.email and user.password
        */
        api.user.register = function(user){

            return $http.post('/api/user', user)
                .then(function(res){
                    return res.data;
                }, function(res){
                    throw res.data.error;
                });

        };

        api.user.setPassword = function(user){


        };

        /**
            user.email
            user.password
        */
        api.user.login = function(user){


            return $http.post('/api/user/token', user)
                .then(function(res){

                    if (res.data.token) {
                        token = res.data.token;

                        api.user._id = token._id;

                        $http.defaults.headers.common.Authorization = token.base64;

                        if (user.rememberLogin) {
                            $window.localStorage.setItem("token", JSON.stringify(token));
                        }else{
                            $window.sessionStorage.setItem("token", JSON.stringify(token));
                        }
                    }
                }, function(res){
                    throw res.data.error;
                });
        };

        api.user.logout = function(){
            token = null;
            $window.localStorage.removeItem('token');
            $window.sessionStorage.removeItem('token');
            $http.defaults.headers.common.Authorization = '';
            api.user._id = null;
        };

        api.user.passwordStrength = function(password) {

            return $http.post('/api/util/passwordStrength', {password : password})
                .then(function(res){
                    return res.data;
                }, function(res){
                    throw res.data.error;
                });
        };

        return function(dependencies){
            var promises = [];

            if (typeof dependencies === 'string') {
                dependencies = [dependencies];
            }

            dependencies.forEach(function(model){
                if (!api[model]) {
                    // TODO : set headers based on if authentication is needed?

                    promises.push($http.get('/api/' + model + '/model')
                    .then(function(res){
                        // build api for model based on template presented by the server
                        api[model] = JSON.parse(res.data);

                        api[model].create = function(data){
                            return $http.post('/api/' + model, data)
                            .then(function(res){
                                return res.data[model];
                            })
                            .catch(function(res){
                                throw res.data.error
                            });
                        };

                        api[model].update = function(_id, data) {
                            return $http.post('/api/' + model + '/' + _id, data)
                            .then(function(res){
                                return res.data[model];
                            })
                            .catch(function(res){
                                throw res.data.error
                            });
                        }

                        api[model].get = function(_id){
                            return $http.get('/api/' + model + '/' + _id)
                            .then(function(res){
                                return res.data[model];
                            })
                            .catch(function(res){
                                throw res.data.error
                            });
                        };

                        // replace dummy fields with functions
                        for(var prop in api[model].static) {
                            api[model].static[prop] = function(params) {
                                return $http({
                                    url: '/api/' + model + '/' + prop,
                                    method: "GET",
                                    params: params
                                })
                                .then(function(res){
                                    return res.data[prop];
                                })
                                .catch(function(res){
                                    throw res.data.error
                                });
                            }
                        }

                        for(var prop in api[model].safe) {
                            api[model].safe[prop] = function(_id, params) {
                                return $http({
                                    url: '/api/' + model + '/' + _id + '/' + prop,
                                    method: "GET",
                                    params: params
                                })
                                .then(function(res){
                                    return res.data[prop];
                                })
                                .catch(function(res){
                                    throw res.data.error
                                });
                            }
                        }

                        for(var prop in api[model].unsafe) {
                            api[model].unsafe[prop] = function(_id, data) {
                                return $http.post('/api/' + model + '/' + _id + '/' + prop, data)
                                .then(function(res){
                                    return res.data[prop];
                                })
                                .catch(function(res){
                                    throw res.data.error
                                });
                            }
                        }
                    }));
                }
            });

            return $q.all(promises)
            .then(function(){
                return api;
            });

        };
    }]);

});
