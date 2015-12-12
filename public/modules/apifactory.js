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


        api.user = {
            guest : false,
            _id : null
        };
        var user_token = null;
        var guest_token = null;

        /**
            Determine if user is already logged in based on expiration date in
            the token.

            @return true if logged in as a user
        */
        api.user.isLoggedIn = function() {

            if (user_token) {
                return true;
            }

            if (guest_token) {
                return false;
            }


            // check local storage for a user login
            user_token = JSON.parse($window.localStorage.getItem("user_token"));

            if (user_token && user_token.base64) {
                $http.defaults.headers.common.Authorization = user_token.base64;
                api.user._id = user_token._id;
                api.user.guest = false;
                return true;
            }

            // check session storage for a user login
            user_token = JSON.parse($window.sessionStorage.getItem("user_token"));

            if (user_token && user_token.base64) {
                $http.defaults.headers.common.Authorization = user_token.base64;
                api.user._id = user_token._id;
                api.user.guest = false;
                return true;
            }

            // check session storage for a guest account
            guest_token = JSON.parse($window.sessionStorage.getItem("guest_token"));

            if (guest_token && guest_token.base64) {
                $http.defaults.headers.common.Authorization = guest_token.base64;
                api.user._id = guest_token._id;
                api.user.guest = true;
                return false;
            }

            // there is no record of a user or a guest on this computer that could
            // be found. so the only recourse is to request a guest account from the
            // server.
            $http.post('/api/user/guest')
                .then(function(res){

                    if (res.data.token) {
                        guest_token = res.data.token;
                        api.user.guest = true;
                        api.user._id = guest_token._id;

                        $http.defaults.headers.common.Authorization = guest_token.base64;

                        $window.sessionStorage.setItem("guest_token", JSON.stringify(guest_token));

                    }
                }, function(res){
                    // can't do anything because this promise doesn't go anywher
                    // TODO: implement a more general error handling module
                });

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
                    throw (res.data && res.data.error) || res;
                });

        };

        api.user.setPassword = function(user){


        };

        /**
            user.email
            user.password
        */
        api.user.login = function(user){

            // TODO: after logging in, convert the guest account
            return $http.post('/api/user/token', user)
                .then(function(res){

                    if (res.data.token) {
                        user_token = res.data.token;
                        api.user.guest = false;

                        api.user._id = user_token._id;

                        $http.defaults.headers.common.Authorization = user_token.base64;

                        if (user.rememberLogin) {
                            $window.localStorage.setItem("user_token", JSON.stringify(user_token));
                        }else{
                            $window.sessionStorage.setItem("user_token", JSON.stringify(user_token));
                        }

                        if (guest_token) {
                            return $http.post('/api/user/merge', {
                                fromToken : guest_token,
                                toToken : user_token
                            })
                            .then(function(){
                                guest_token = null;
                                $window.sessionStorage.removeItem('guest_token');

                            });
                        }
                    }
                }, function(res){
                    throw res.data.error;
                })
                .catch(function(res){
                    throw (res.data && res.data.error) || res;
                });
        };

        api.user.logout = function(){
            // logout also functions as complete reset to default values.
            user_token = null;
            guest_token = null;
            $window.localStorage.removeItem('user_token');
            $window.sessionStorage.removeItem('user_token');
            $window.sessionStorage.removeItem('guest_token');
            $http.defaults.headers.common.Authorization = '';
            api.user._id = null;
            api.user.guest = false;

            api.user.isLoggedIn();
        };

        api.user.passwordStrength = function(password) {


            return $http.post('/api/util/passwordStrength', {password : password})
                .then(function(res){
                    return res.data;
                }, function(res){
                    throw (res.data && res.data.error) || res;
                });
        };

        api.user.testAccess = function(model, element, action) {
            // say there is no access if the model or security is undefined, which just means it hasn't been loaded
            if (!api[model] || !element.security){
                return false;
            }

            var security = element.security[action];

            if (action !== 'root' && (!api[model].secure[action] || (security && security.unrestricted))) {
                // if there is no security, let anyone through (root is always secure)
                return true;
            }

            // there is security, so a user has to be logged in at least
            if (!api.user._id) {
                return false;
            }

            if (security) {
                // try finding the user directly
                if (security.users && _.indexOf(security.users, api.user._id, true) !== -1) {
                    return true;
                }

                // TODO: implement client-side group info
                // see if the user belongs to a group that has access
                //if (user.groups && security.groups && hasCommonElement(user.groups, security.groups)){
                //    return true;
                //}
            }

            if (action === 'root') {
                return false;
            }else{
                // as a last resort, any user able to be root can do also anything else
                return api.user.testAccess(model, element, 'root');
            }
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
                        api[model] = res.data;

                        api[model].create = function(data){
                            return $http.post('/api/' + model, data)
                            .then(function(res){
                                return res.data[model];
                            })
                            .catch(function(res){
                                throw (res.data && res.data.error) || res;
                            });
                        };

                        api[model].update = function(_id, data) {
                            return $http.post('/api/' + model + '/' + _id, data)
                            .then(function(res){
                                return res.data[model];
                            })
                            .catch(function(res){
                                throw (res.data && res.data.error) || res;
                            });
                        }

                        api[model].get = function(_id){
                            return $http.get('/api/' + model + '/' + _id)
                            .then(function(res){
                                return res.data[model];
                            })
                            .catch(function(res){
                                throw (res.data && res.data.error) || res;
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
                                    throw (res.data && res.data.error) || res;
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
                                    throw (res.data && res.data.error) || res;
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
                                    throw (res.data && res.data.error) || res;
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
