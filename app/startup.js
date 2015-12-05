'use strict';

define(['config/App'], function (app) {
    //Configurasyon
    app.config(function (ConfigProvider, SecurityConfigProvider) {
        //Genel Ayarlar
        ConfigProvider.appVersion = "1.0.0";
        ConfigProvider.projectTitle = 'YNL Kasa';
        ConfigProvider.defaultApiUrl = 'http://ynlapitest.bimar.com';
        //ConfigProvider.defaultApiUrl = 'http://localhost:18745';
        //ConfigProvider.defaultApiUrl = 'https://ynlapi.arkas.com';
        ConfigProvider.debugMode = true;
        ConfigProvider.elmahLoggingEnabled = false;
        //OAuth Settings
        SecurityConfigProvider.oauthOptions.loginBaseUri = 'http://oauthtest.bimar.com/auth-ynl';
        //SecurityConfigProvider.oauthOptions.loginBaseUri = 'http://localhost:44014/auth-ynl';
        SecurityConfigProvider.oauthOptions.scope = 'mobile';
        SecurityConfigProvider.oauthOptions.accountStore = 'ynl';
    }).run([
        'Routing', function (routing) {
            var appViews = [
                 {
                     state: 'intro',
                     url: '/intro',
                     templateUrl: 'kasa/home/intro',
                     controller: 'IntroController',
                     intro: true
                 },
                {
                    state: 'home',
                    url: '/home',
                    templateUrl: 'kasa/home/home',
                    controller: 'HomeController'
                },
                {
                    state: 'home.kasaHareketListe',
                    url: '/kasaHareketListe',
                    templateUrl: 'kasa/hareket/liste',
                    controller: 'KasaHareketListeController',
                    view: 'home-liste',
                },
                {
                    state: 'home.kasaHareketDetay',
                    url: '/kasaHareketDetay/:id',
                    templateUrl: 'kasa/hareket/detay',
                    controller: 'KasaDetayController',
                    view: 'home-liste'
                }
            ];
            //Map all states
            routing.map(appViews)
                   .start('home.kasaHareketListe');
        }
    ]);
});
