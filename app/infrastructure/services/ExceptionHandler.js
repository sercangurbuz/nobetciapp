'use strict';

define(['angular'], function (angular) {
    //Angular exceptionlarini yakalayarak Logger a gonder    
    var ExceptionHandler = function ($delegate, $injector, config) {
        var http, rootScope;
        var elmahLogCount = 1;
        //Elmah webapi backend url
        var elmahEndpointUrl = config.defaultApiUrl ?
            (config.defaultApiUrl + config.elmahLoggingBackendUrl) : config.elmahLoggingBackendUrl;
        //Broadcast exception
        var broadcastEx = function (exception) {
            rootScope = rootScope || $injector.get('$rootScope');
            //Exception olustu ve loglandi
            rootScope.$broadcast(config.events.onexception, exception);
        };
        //Elmah log
        var elmahLog = function (exception) {
            //Max log sayisini aşmamis olmasi gerekiyor.
            if (elmahLogCount >= config.elmahMaxLogCountInSession)
                return;
            //Herhangi bir circular reference olmamasi icin $injector ile aliyoruz
            //TODO:CurrentUser message'a eklenmeli
            http = http || $injector.get('$http');
            http({
                method: 'POST',
                url: elmahEndpointUrl,
                showSpinner: false,
                data: {
                    Message: exception.message,
                    Stack: exception.stack,
                    AppVersion: config.appVersion
                },
                headers: { 'Content-Type': 'application/json' }
            }).finally(function () {
                broadcastEx(exception);
                elmahLogCount++;
            });
        };

        return function (exception, cause) {
            //Orjinal methodu cagir eger debug moddaysak
            if (config.debugMode) {
                $delegate(exception, cause);
            } else {
                //Elmah Logging
                if (config.elmahLoggingEnabled) {
                    try {
                        elmahLog(exception);
                    } catch (e) { }
                } else {
                    broadcastEx(exception);
                }
            };
        };
    };
    //Register
    angular.module('rota.services.exceptionhandler', [])
        .config(['$provide', function ($provide) {
            $provide.decorator('$exceptionHandler', ['$delegate', '$injector', 'Config', ExceptionHandler]);
        }]);
});