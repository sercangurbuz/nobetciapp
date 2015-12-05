'use strict';

define(['angular'], function (angular) {
    //Localization iþlemlerinin yapýldýdý sýnýf
    angular.module('rota.services.events', []).factory('Events', ['$rootScope', 'Config', 'Logger',
        function ($rootScope, config, logger) {
            //Handle deviceReady event
            document.addEventListener("deviceready", onDeviceReady, false);
            //DeviceReady event
            function onDeviceReady() {
                //Triggered when app send to background
                document.addEventListener("pause", onPause, false);
                //Triggered when app get back to front
                document.addEventListener("resume", onResume, false);
                //Triggered when app go offline
                document.addEventListener("offline", onOffline, false);
                //Triggered when app back online 
                document.addEventListener("online", onOnline, false);
            }
            //online event
            function onOnline() {
                logger.log('app gone back online !');
                $rootScope.$apply(function () {
                    $rootScope.$broadcast(config.events.online);
                });
            }
            //offline event
            function onOffline() {
                logger.log('app gone offline !');
                $rootScope.$apply(function () {
                    $rootScope.$broadcast(config.events.offline);
                });
            }
            //resume event
            function onResume() {
                logger.log('app resumed !');
                $rootScope.$broadcast(config.events.resume);
            }
            //puse event
            function onPause() {
                logger.log('app paused !');
                $rootScope.$broadcast(config.events.pause);
            }

            function isOnline() {
                var networkState = navigator.connection.type;
                return networkState !== Connection.UNKNOWN && networkState !== Connection.NONE;
            }

            function isOffline() {
                var networkState = navigator.connection.type;
                return networkState === Connection.UNKNOWN || networkState === Connection.NONE;
            }
            //Sonuc
            return {
                isNetworkOnline: isOnline,
                isNetworkOffline: isOffline
            };
        }]).run(['Events', function (events) {
            //Just Initiate Events service
        }
        ]);
});