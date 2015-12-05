'use strict';

define(['config/Infrastructure.Index'], function () {
    //Ana uygulama modulunu yarat- (Uygulama module adi : rota-mobile-app)
    var app = angular.module('rota-mobile-app', ['rota', 'ionic']);
    //Lazy Loading icin provider'lari instance a cekiyoruz
    app.config(['$controllerProvider', '$compileProvider', '$filterProvider', '$provide',
        function ($controllerProvider, $compileProvider, $filterProvider, $provide) {
            //Performans artişi icin Class atamalarini daibled ediyoruz
            //https://docs.angularjs.org/guide/production
            $compileProvider.debugInfoEnabled(false);

            //#region Runtime register services
            //Lazy loading işlemleri icin provider'lar instance'a cekiliyor
            app.register =
            {
                controller: $controllerProvider.register,
                directive: $compileProvider.directive,
                filter: $filterProvider.register,
                factory: $provide.factory,
                service: $provide.service
            };
            //#endregion

            //#region Add Api Service
            //Alt sınıflarda kullanilan servislerin tek bir objede register eden utility method
            app.addServiceApi = function (serviceName, Service, dependencies) {
                //Built-in dependencies - Ek dependencies ile birleştiriliyor
                var dep = ['$q', '$http', 'Common', 'Caching', 'Routing', 'Logger', 'Config'].concat(dependencies || []),
                    //Injected function
                    fn = function () {
                        //Servislerini tek bir bundle haline getir
                        var bundle =
                        {
                            '$q': arguments[0],
                            '$http': arguments[1],
                            'common': arguments[2],
                            'caching': arguments[3],
                            'routing': arguments[4],
                            'logger': arguments[5],
                            'config': arguments[6]
                        };
                        //Verilen controlleri create et - Extra 3 dependency servisi ekleyebiliyoruz,duruma gore bakariz !
                        var instance = new Service(bundle, arguments[7], arguments[8]);
                        //Instance'i dondur
                        return instance;
                    };
                //Fonksiyonu son obje olarak dizinin sonuna ekle
                dep.push(fn);
                //Register et
                app.register.service(serviceName, dep);
                //Modulu dondur
                return app;
            };
            //#endregion

            //#region Add Controller
            //Alt sınıflarda kullanilan servislerin tek bir objede register eden utility method
            app.addController = function (controllerName, Controller, dependencies) {
                //Built-in dependencies - Ek dependencies ile birleştiriliyor
                var dep = ['$rootScope', '$scope', '$stateParams', '$q', '$http', '$ionicLoading', '$ionicNavBarDelegate',
                        'Common', 'CommonUI', 'Caching', 'Routing', 'Localization', 'Dialogs', 'Modal',
                        'Plugins', 'Config', 'Logger'].concat(dependencies || []),
                    //Injected function
                    fn = function () {
                        //Servislerini tek bir bundle haline getir
                        var bundle =
                        {
                            '$rootScope': arguments[0],
                            '$scope': arguments[1],
                            '$routeParams': arguments[2],
                            '$q': arguments[3],
                            '$http': arguments[4],
                            '$ionicLoading': arguments[5],
                            '$ionicNavBarDelegate': arguments[6],
                            'common': arguments[7],
                            'commonui': arguments[8],
                            'caching': arguments[9],
                            'routing': arguments[10],
                            'localization': arguments[11],
                            'dialogs': arguments[12],
                            'modal': arguments[13],
                            'plugins': arguments[14],
                            'config': arguments[15],
                            'logger': arguments[16]
                        };
                        //Verilen controlleri create et - Extra 3 dependency servisi ekleyebiliyoruz,duruma gore bakariz !
                        var instance = new Controller(bundle, arguments[17], arguments[18]);
                        //Instance'i dondur
                        return instance;
                    };
                //Fonksiyonu son obje olarak dizinin sonuna ekle
                dep.push(fn);
                //Register et
                app.register.controller(controllerName, dep);
                //Modulu dondur
                return app;
            };
            //#endregion
        }
    ]);
    //Applicationi döndur
    return app;
});