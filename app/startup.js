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

        ConfigProvider.dbName = "sifa.nobetcidb";

        //Security
        SecurityConfigProvider.allowAnonymousAccess = true;
    }).run([
        '$injector', 'Routing', 'Plugins', 'Config', function ($injector, routing, plugins) {
            //Create Db

            //var result = plugins.openDb("sifanobetci.db", [
            //    { query: 'CREATE TABLE IF NOT EXISTS tbl_nobetciler (id integer primary key autoincrement, adsoyad varchar(250),icon text)' }
            //    //{ query: 'ALTER TABLE tbl_nobetciler ADD COLUMN imza text;' }
            //]);

            //Register routes
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
                    url: '/nobetciler/:id',
                    templateUrl: 'nobetci/nobetciler/detay',
                    controller: 'nobetciController',
                    view: 'home-liste'
                },
                {
                    state: 'home.imza',
                    url: '/imza',
                    templateUrl: 'nobetci/nobetciler/imza',
                    controller: 'imzaController',
                    view: 'home-liste'
                }
            ];
            //Map all states
            routing.map(appViews)
                   .start('home.nobetciler');
        }
    ]);
});
