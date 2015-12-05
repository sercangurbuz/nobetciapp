'use strict';

define(['angular', 'base/BaseService', 'uiRouter'],
    function (angular, BaseService) {
        //Route Manager
        var Routing = BaseService.extend({
            //#region Props
            //Sistem Params
            $state: null,
            $stateParams: null,
            introState: null,
            //#endregion

            //#region Methods
            //Methods
            go: function (state, params) {
                return this.$state.go(state, params);
            },
            //Register state
            /*  state: 'home.aar',
                        url: '/aar/:category',
                        templateUrl: 'app/bys/aar/aar.html',
                        controller: 'ArkasAkilliRehberController',
                        controllerUrl: 'app/bys/aar/ArkasAkilliRehber.js',
                        view: 'tab-aar',
                        requireAuth: true,
                        cache: true,
                        intro: true*/
            map: function (routes) {
                var self = this,
                    states = angular.isArray(routes) ? routes : [routes];

                angular.forEach(states, function (state) {
                    //RequireJs deki baseUrl ye gore app veya dist oalrak rootPathi deðiþtiriyoruz
                    var rootPath = self.common.addTrailingSlash(self.config.basePath()),
                        //Template fullpath
                        fileName = rootPath + (state.templateUrl && state.templateUrl) + '.html',
                        //Controller Adi    
                        controller = state.controller || ((state.controllerUrl || state.templateUrl).split('/').pop() + 'Controller'),
                        //Controller fullpath
                        controllerFullName = rootPath + (state.controllerUrl || state.templateUrl) + '.js',
                        //State Object
                        stateObj = {
                            url: state.url,
                            //Default view cacheleme yapilacak
                            cache: state.cache || true
                        },
                        //View Details
                        viewDetails = {
                            templateUrl: fileName,
                            controller: controller,
                            //Resolve params
                            resolve: {
                                //Kullanici authenticated mi ?
                                authenticated: [
                                    'Security', function (security) {
                                        return security.isRouteAuthenticated(state);
                                    }
                                ],
                                //Check App (Enabled,Release Notes,Version ...)
                                checkApp: ['Security', function (security) {
                                    return security.checkApp();
                                }],
                                //Lazy loading zimbirtisi,Sorgulanan controlleri yukluyoruz
                                load: [
                                    '$q', '$rootScope', function ($q, $rootScope) {
                                        return self.resolveDependencies($q, $rootScope, [controllerFullName]);
                                    }
                                ]
                            }
                        };
                    //View veya Abstract ayrýmý
                    if (state.view) {
                        stateObj.views = {};
                        stateObj.views[state.view] = viewDetails;
                    } else {
                        stateObj = angular.extend(stateObj, viewDetails);
                        stateObj.abstract = !state.intro;
                        if (state.intro) {
                            self.introState = state.state;
                            stateObj.cache = false;
                        }
                    }
                    //routeProvider'a menuyu ekle
                    self.stateProvider.state(state.state, stateObj);
                });
                return self;
            },
            //Varsyailan Route'u tanýmlar
            start: function (defaultState, params) {
                //Varsayilan state
                this.defaultState = defaultState;
                var defaultUrl = this.$state.href(defaultState, params);
                this.urlRouterProvider.otherwise(defaultUrl);
                //Intro varmi ?
                var showIntro = this.introState && !this.caching.restoreFromCache(this.config.introViewedStorageName);
                //Intro varsa intro state'ine yoksa default statet'e git
                this.go(showIntro ? this.introState : defaultState);
            },
            //Varsayilan state i aktif eder
            startApp: function (url) {
                this.caching.saveToCache(this.config.introViewedStorageName, true);
                return this.go(url || this.defaultState);
            },
            //Controller dosyasini remote'dan yükle
            resolveDependencies: function ($q, $rootScope, dependencies) {
                var defer = $q.defer();
                //Talep edilen controller'i yukle
                require(dependencies, function () {
                    defer.resolve();
                    $rootScope.$apply();
                });
                //Promise dondur
                return defer.promise;
            },
            //#endregion

            //#region Init
            //Constructor
            init: function ($rootScope, $state, $stateParams, stateProvider,
                            urlRouterProvider, config, common, caching) {
                $rootScope.$state = this.$state = $state;
                $rootScope.$stateParams = this.$stateParams = $stateParams;
                this.stateProvider = stateProvider;
                this.urlRouterProvider = urlRouterProvider;
                this.config = config;
                this.common = common;
                this.caching = caching;
            }
            //#endregion
        });
        //#region Register
        //Register
        angular.module('rota.services.routing', ['ui.router']).factory('Routing',
            [
                '$rootScope', '$state', '$stateParams', 'StateProvider', 'UrlRouterProvider', 'Config', 'Common', 'Caching',
                function ($rootScope, $state, $stateParams, stateProvider, urlRouterProvider, config, common, caching) {
                    return new Routing($rootScope, $state, $stateParams, stateProvider,
                        urlRouterProvider, config, common, caching);
                }
            ]) //$stateProvider ve $urlRouterProvider runtime'a cek
            .config([
                '$provide', '$stateProvider', '$urlRouterProvider',
                function ($provide, $stateProvider, $urlRouterProvider) {
                    //Register state provider
                    $provide.factory('StateProvider', function () {
                        return $stateProvider;
                    });
                    //Register urlRouterProvider provider
                    $provide.factory('UrlRouterProvider', function () {
                        return $urlRouterProvider;
                    });
                }
            ]);
        //#endregion
    });