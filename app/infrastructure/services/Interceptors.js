'use strict';

define(['angular'], function (angular) {
    //Bekleyen askıda request varmı
    angular.module('rota.services.httpRequestTracker', []).factory('httpAjaxInterceptor', [
        '$injector','$q', '$rootScope', '$timeout', 'Config',
        function ($injector,$q, $rootScope, $timeout, config) {
            var queue = [];
            var timerPromise = null;
            var timerPromiseHide = null;

            function processRequest() {
                queue.push({});
                if (queue.length == 1) {
                    timerPromise = $timeout(function () {
                        if (queue.length) {
                            $rootScope.$broadcast(config.events.ajaxStarted);
                        }
                    }, 100);
                }
            }

            function processResponse() {
                queue.pop();
                if (queue.length == 0) {
                    //Since we don't know if another XHR request will be made, pause before
                    //hiding the overlay. If another XHR request comes in then the overlay
                    //will stay visible which prevents a flicker
                    timerPromiseHide = $timeout(function () {
                        //Make sure queue is still 0 since a new XHR request may have come in
                        //while timer was running
                        if (queue.length == 0) {
                            $rootScope.$broadcast(config.events.ajaxFinished);
                            if (timerPromiseHide) $timeout.cancel(timerPromiseHide);
                        }
                    }, 500);
                }
            }

            return {
                request: function (config) {
                    if (config.showSpinner === undefined || config.showSpinner)
                        processRequest();
                    return config || $q.when(config);
                },
                response: function (response) {
                    processResponse();
                    return response || $q.when(response);
                },
                responseError: function (rejection) {
                    processResponse();
                    return $q.reject(rejection);
                    //return rejection || $q.when(rejection);
                }
            };
        }
    ]).factory('errorHttpInterceptor', ['$q', 'Logger',
            function ($q, logger) {
                return {
                    response: function (response) {
                        if (response.status == 401) {
                            return response;
                        } else if (response.status == 400 && response.data && response.data.message) {
                            logger.error(response.data.message, response);
                            return $q.reject(response);
                        } else if (response.status === 0) {
                            logger.error('Server connection lost', response);
                            return $q.reject(response);
                        } else if (response.status >= 400 && response.status < 500) {
                            logger.error('Server was unable to find' +
                                ' what you were looking for... Sorry!!', response);
                            return $q.reject(response);
                        }
                        return response;
                    }
                };
            }])
        .config(['$httpProvider', function ($httpProvider) {
            // $httpProvider.interceptors.push('httpRequestInterceptorIECacheSlayer');
            //$httpProvider.interceptors.push('errorHttpInterceptor');
            $httpProvider.interceptors.push('httpAjaxInterceptor');
        }]);
});