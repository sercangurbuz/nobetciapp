'use strict';

define(['base/BaseConfig', 'angular'], function (BaseConfig, angular) {
    //Genel Config
    var Config = BaseConfig.extend({
        dbConfig: null,
        //Project Title
        projectTitle: null,
        //Kendi hatalarimizi exception handler gostermisin die (mukerrer hata mesaji) Bkz:exceptionHandler
        appErrorPrefix: '[Rota Error] ',
        elmahLoggingBackendUrl: null,
        elmahLoggingEnabled: null,
        elmahMaxLogCountInSession: null,
        //App check (Enabled,Version,Release Notes vs..)
        appCheckEnabled: null,
        appCheckBackendUrl: null,
        //Intro check localstroge name
        introViewedStorageName: null,
        //Applcation genelinde kullanilan Events degerleri
        events: {
            userLoginChanged: 'userLoginChanged',
            loginRequired: 'auth-loginRequired',
            controllerLoaded: 'controllerLoaded',
            ajaxStarted: 'ajaxStarted',
            ajaxFinished: 'ajaxFinished',
            entityImport: 'entityImport',
            offline: 'offline',
            online: 'online',
            resume: 'resume',
            pause: 'pause',
            onexception: 'onexception'
        },
        //App Version
        appVersion: null,
        //tum dosyalar icin base path
        basePath: null,
        //EMail web api url
        emailWebApiBackendUrl: null,
        //Debug Mode
        debugMode: null,
        //Vasayilan default api url
        defaultApiUrl: null,
        //Genel config varsayilan degerler
        defineDefauts: function () {
            this.appVersion = '1.0.1';
            this.localizationFilesPath = './i18n';
            this.projectTitle = 'Bimar Ionic Mobile Application';
            this.appCheckEnabled = true;
            this.appCheckBackendUrl = 'api/app/checkapp';
            this.emailWebApiBackendUrl = 'api/email/sendemail';
            this.elmahLoggingBackendUrl = '/api/elmah/record';
            this.elmahMaxLogCountInSession = 5;
            this.debugMode = true;
            this.elmahLoggingEnabled = false;
            this.introViewedStorageName = 'intro.viewed';
            this.basePath = function () {
                var globalConfigs = requirejs.s.contexts._.config;
                return globalConfigs.baseUrl; // > fr-fr
            };
        }
    });
    //Register
    angular.module('rota.config', []).provider('Config', Config);
});