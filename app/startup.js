'use strict';

define(['config/App'], function (app) {
    //Configurasyon
    app.config(function (ConfigProvider, SecurityConfigProvider) {
        //Genel Ayarlar
        ConfigProvider.appVersion = "1.0.0";
        ConfigProvider.projectTitle = 'YNL Kasa';
        ConfigProvider.debugMode = true;
        ConfigProvider.elmahLoggingEnabled = false;
        ConfigProvider.appCheckEnabled = false;
        //Security
        SecurityConfigProvider.allowAnonymousAccess = true;
    }).run([
        'Routing', function (routing) {
            var appViews = [
                {
                    state: 'home',
                    url: '/home',
                    templateUrl: 'nobetci/home/home',
                    controller: 'HomeController'
                },
                {
                    state: 'home.nobetciler',
                    url: '/nobetciler',
                    templateUrl: 'nobetci/nobetciler/liste',
                    controller: 'nobetcilerController',
                    view: 'home-liste'
                },
                {
                    state: 'home.nobetci',
                    url: '/nobetci/:id',
                    templateUrl: 'nobetci/nobetciler/detay',
                    controller: 'nobetciController',
                    view: 'home-liste'
                }
            ];
            //Map all states
            routing.map(appViews)
                   .start('home.nobetciler');
        }
    ]);
});
