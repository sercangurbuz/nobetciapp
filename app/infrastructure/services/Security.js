'use strict';
//'jws', 'rsa', 'jsonsanseval', 'crypto'
define(['base/BaseService', 'base/BaseConfig', 'underscore', 'angular', 'services/Dialogs'],
    function (BaseService, BaseConfig, _, angular) {

        //#region Security Consts
        angular.module('rota.security.consts', []).value('SecurityConsts', {
            //OpenId BuiltIn claim names
            openIdBuiltInClaims: [
                'iss', 'sub', 'aud', 'exp', 'iat', 'acr', 'amr', 'azp',
                'nonce', 'auth_time', 'client_id', 'idp', 'nbf', 'scope'
            ],
            claims: {
                //Claim tanımlamalari
                fullname: 'fullname',
                name: 'name',
                email: 'email',
                authorizedcompaines: 'authorizedcompanies',
                managerId: 'managerid',
                languageId: 'languageid',
                userid: 'id'
            },
            //Varsayilan login view url 
            defaultLoginPath: 'infrastructure/ui/views/login.html'
        });
        //#endregion

        //#region Security Config
        //Security config class
        var SecurityConfigProvider = BaseConfig.extend({
            //#region Configurations
            //Varsayilan authorization kontrolu - app security init'de check ediliyor.
            allowAnonymousAccess: null,
            //Authentication storage adi
            tokenStorageName: null,
            //Username storage name
            usernameStorageName: null,
            //Login template url
            loginTemplateUrl: null,
            //Ping path
            pingPath: null,
            //Profile Path
            profilePath: null,
            //OAuth icin kullanilan path bilglieri
            oauthOptions: {
                //implicitGrantFlow : Login ekrani 'loginBaseUri' config'de belitilen uri'ye yonlendirilir.
                //resourceOwnerFlow : Login ekrani modal olarak acilir waiting request queue başarili login sonrasi işletilir.
                flowKind: null,
                //OAuth client id
                client_id: null,
                //OAuth client secret
                client_secret: null,
                //OAuth state
                state: null,
                //Login base uri
                loginBaseUri: null,
                //Token url
                loginTokenPath: null,
                //Token Type
                tokenType: null,
                //Return Path
                returnPath: null,
                //Token validation endpoint
                tokenValidationPath: null,
                //Kullanıcınin hangi rota login endpointten validate olucagini ifade eder
                accountStore: null,
                //OAuth scope bilgisi
                scope: null
            },
            //#endregion

            //#region Default Values
            defineDefauts: function () {
                //Varsayilan security ayarı
                this.allowAnonymousAccess = false;
                //Varsayilan token storage adi
                this.tokenStorageName = 'rota-access-token';
                //Username storage key
                this.usernameStorageName = 'rota-username';
                //Varsayilan ping pathi
                this.pingPath = null;
                //Varsayilan login methodu
                this.oauthOptions.flowKind = 'resourceOwnerFlow';
                //Varsayilan OAuth token pathi
                this.oauthOptions.loginTokenPath = '/connect/token';
                //Grant Authorize pathi
                this.oauthOptions.loginAuthorizePath = '/OAuth/Authorize';
                //Varsayilan OAuth authourization/login pathi
                this.oauthOptions.loginBaseUri = 'http://login.bimar.com';
                //Varsayilan OAuth client id & client_secret
                this.oauthOptions.client_id = 'rota_rof_client';
                this.oauthOptions.client_secret = 'secret';
                //Varsayilan OAuth state bilgisi
                this.oauthOptions.state = 'rota-secure-state';
                //JSON web signature endpoint 
                this.jwtSignatureEndPoint = '/.well-known/jwks';
                //Token validation path
                this.oauthOptions.tokenValidationPath = '/connect/accesstokenvalidation';
                //Token Type - JWT,Reference
                this.oauthOptions.tokenType = 'reference';
            }
            //#endregion
        });
        //#region Register
        //Register security config
        angular.module('rota.security.config', []).provider('SecurityConfig', SecurityConfigProvider);
        //#endregion
        //#endregion

        //#region Security Service
        //Security Service
        var Security = BaseService.extend({
            //#region Props
            //Module Id
            moduleId: 'Security Service',
            //DI members
            rootScope: null,
            http: null,
            q: null,
            retryQueue: null,
            securityConfig: null,
            modal: null,
            config: null,
            common: null,
            isBusy: null,
            redirecting: null,
            _tokens: null,
            accessStatePromise: null,
            appPromise: null,
            appData: null,
            //Aktif kullanici
            currentUser: null,
            //#endregion

            //#region Check Login Status
            //Kullanici login durumu
            isAuthenticated: function () {
                return !!this.currentUser;
            },
            //Secili olan route'un yetkilendirme işlemi yapılır
            isRouteAuthenticated: function (route) {
                var requireAuthentication = !this.securityConfig.allowAnonymousAccess ||
                                            (route.requireAuth && this.securityConfig.allowAnonymousAccess);
                //Eger anounymous giriş ise
                if (requireAuthentication) {
                    this.logger.warn(route.state + ' state is requiring authentication');
                    //Eger AnonymousAccess varsa token validation yoksa initteki validation resultu donuyoruz
                    return this.securityConfig.allowAnonymousAccess ? this.validateRequest() :
                        (this.accessStatePromise || (this.accessStatePromise = this.validateRequest()));
                } else {
                    //Anounymous giriş 
                    return this.q.when(null);
                }
            },
            //#endregion

            //#region Login Actions
            //Tokenin validmi olduguna bakiyoruz
            validateRequest: function () {
                var token = this._tokens.token;
                return this.common.isNullOrEmpty(token) ? this.handleUnAuthorized() :
                    (this.securityConfig.oauthOptions.tokenType.toLowerCase() == 'jwt' ? this.jwthelper.verifyJWT(token) : this.ping(token));
            },
            //Server'a ping atarak tokeni validate ediyoruz
            ping: function (token) {
                this.logger.info('Pinging to identity server');
                //Eger pingPath tanımlı değilse varsayilan validationToken endpoint'e request atiliyor
                var pingPath = (this.securityConfig.pingPath ||
                    (this.securityConfig.oauthOptions.loginBaseUri + this.securityConfig.oauthOptions.tokenValidationPath)) +
                    '?token=' + token + '&client_id=' + this.securityConfig.oauthOptions.client_id;

                return this.http.get(pingPath, { pingRequest: true });
            },
            //Claim bilgilerini al
            //Unauthorized getProfile requesti iterceptor tarafindan yakalanmiyor
            getProfile: function (token) {
                this.logger.log('Getting user profile-claims', token);
                //Eger profilePath tanımlı değilse varsayilan validationToken endpoint'e request atiliyor
                var profilePath = (this.securityConfig.profilePath ||
                    (this.securityConfig.oauthOptions.loginBaseUri + this.securityConfig.oauthOptions.tokenValidationPath)) +
                    '?token=' + token + '&client_id=' + this.securityConfig.oauthOptions.client_id;

                return this.http.get(profilePath, { profileRequest: true, ignoreAuthModule: true });
            },
            //Verilen data parametresine gore token endpoint'e POST requesti ceker
            requestToken: function (data) {
                var self = this,
                  deferred = this.q.defer();
                //Token path kontrol
                if (!this.securityConfig.oauthOptions.loginTokenPath) {
                    throw new Error('Please define login token path');
                }
                //Token path
                var tokenPath = this.securityConfig.oauthOptions.loginBaseUri +
                    this.securityConfig.oauthOptions.loginTokenPath;

                //Token 
                this.http({
                    method: 'POST',
                    url: tokenPath,
                    data: data,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }).success(function (result) {
                    deferred.resolve({
                        token: result.access_token,
                        refresh_token: result.refresh_token
                    });
                }).catch(function (err) {
                    var exmsg = (err.data.InnerException && err.data.InnerException.ExceptionMessage) ||
                                (err.data.ExceptionMessage && err.data.ExceptionMessage) ||
                                 err.data.error;
                    deferred.reject(exmsg);
                });

                return deferred.promise;
            },
            //Token servisine request cekip token bilgisini aliyoruz
            logIn: function (username, password) {
                //Scope ve accountStore kontrolleri
                if (!this.securityConfig.oauthOptions.scope)
                    throw new Error('Please define scope');

                if (!this.securityConfig.oauthOptions.accountStore)
                    throw new Error('Please define accountStore');

                var data = 'grant_type=password' +
                  '&username=' + encodeURIComponent(username.toLowerCase()) +
                  '&password=' + password +
                  '&response_type=token' +
                  '&client_id=' + encodeURIComponent(this.securityConfig.oauthOptions.client_id) +
                  '&client_secret=' + encodeURIComponent(this.securityConfig.oauthOptions.client_secret) +
                  '&scope=' + encodeURIComponent(this.securityConfig.oauthOptions.scope) + ' offline_access' +
                  '&acr_values=tenant:' + encodeURIComponent(this.securityConfig.oauthOptions.accountStore);

                return this.requestToken(data);
            },
            //Login modal ekranını goster
            showLogInModal: function () {
                var self = this,
                    rootPath = self.common.addTrailingSlash(this.config.basePath());
                //Scope credentials
                var scope = this.rootScope.$new(false);
                //Eger cache'de username daha onceden kayit edilmişsse aliyoruz
                scope.credentials = {
                    username: this.caching.restoreFromCache(this.securityConfig.usernameStorageName)
                };
                scope.login = function () {
                    //Validation
                    if (self.common.isNullOrEmpty(this.credentials.username) ||
                        self.common.isNullOrEmpty(this.credentials.password)) {
                        self.commonui.showToast(self.localization.get('rota.kullanicipasswordgiriniz'));
                    } else {
                        //Login OAuth
                        self.logIn(this.credentials.username, this.credentials.password).then(function (data) {
                            //[token,refreshtoken] => username ekleniyor
                            data = self.extend(data, { username: scope.credentials.username });
                            scope.modalResult(data);
                        }, function (error) {
                            self.logger.error(error);
                            self.commonui.showToast(self.localization.get('rota.invalid_grant'));
                            //self.commonui.showToast(error);
                            scope.credentials.password = null;
                        });
                    }
                };
                //Login ekranını goster
                return this.modal.showModal(rootPath + (this.securityConfig.loginTemplateUrl || this.securityconsts.defaultLoginPath),
                    { focusFirstInput: false, scope: scope });
            },
            //#endregion

            //#region UnAuthorized Action
            //Refresh token access token yenile
            needToken: function (refreshToken) {
                var self = this;
                this.logger.info('Token is being refreshed');
                //Eger refresh_token invalid ise user credentiallari soruyoruz
                return this.refreshToken(refreshToken).then(function (data) {
                    self.logger.log('Token has been refreshed', data);
                    return data;
                }, function () {
                    self.logger.warn('Token-Refresh is failed and fall back to login');
                    //Refresing token failed,Goto Login
                    return self.needLogin();
                });
            },
            //refreshToken'a gore access_token bilgisini yeniler
            refreshToken: function (refreshToken) {
                var data = 'grant_type=refresh_token' +
                    '&refresh_token=' + refreshToken +
                    '&client_id=' + encodeURIComponent(this.securityConfig.oauthOptions.client_id) +
                    '&client_secret=' + encodeURIComponent(this.securityConfig.oauthOptions.client_secret);

                return this.requestToken(data);
            },
            //User credentials bilgilerini sor
            needLogin: function () {
                var self = this,
                    d = this.q.defer();
                //Login modal ekranını ac
                this.showLogInModal().then(function (data) {
                    d.resolve(data);
                }, function (error) {
                    d.reject(error);
                    //Eger hardware-back tusuyla ciktiysa uygulamayi kapatiyoruz
                    if (error === self.modal.CANCELLED_ACTION) {
                        //Cancel Butonnu tiklandi
                        //Tum bekleyen requedtleri iptal et
                        self.retryQueue.rejectAll();
                        //Eger allowAnonymousAccess false ise direk cik
                        if (!self.securityConfig.allowAnonymousAccess) {
                            //cik
                            self.exitApp();
                        }
                    }
                });
                //Sonuc
                return d.promise;
            },
            //Yetkisiz işlem gercekleştigi zaman bu method çalişiyor.(Bkz : Interceptor,initSecurity method)
            handleUnAuthorized: function () {
                var self = this;
                //Eger zaten authentication işlemi başladiysa
                if (this.isBusy) {
                    return this.q.when(null);
                }
                this.logger.info('Authorization process started');
                //IsBusy ayarla
                this.isBusy = true;
                //Refresh token'i al
                var refreshToken = this._tokens && this._tokens.refresh_token;
                //Eger refreshToken varsa token yeniliyoruz yoksa login ekranını getiriyoruz
                var authPromise = refreshToken ? this.needToken(refreshToken) : this.needLogin();
                //Sonuc
                return authPromise.then(function (data) {
                    //Login ekranından donen User model bilgisini handle eder
                    //Parametre olarak userModel geciliyor
                    return self.handleUserModel(data);
                }).finally(function () {
                    self.isBusy = false;
                });
            },
            //#endregion

            //#region Set User 
            //User bilgisini parse et - Returns currentUser
            handleUserModel: function (model) {
                var d = this.q.defer(),
                    claims = null,
                    self = this;
                //Authentication icin request header bilgisine token'i ekle
                this.setAuthHeader(model);
                //Token tipine gore claim bilgisni ayarliyoruz
                switch (this.securityConfig.oauthOptions.tokenType.toLowerCase()) {
                    case 'jwt':
                        //Token'dan claim bilgilerini al
                        try {
                            claims = this.jwthelper.decodeJWT(model.token);
                        } catch (e) {
                            this.logger.error('JWT Token is invalid', e);
                            d.reject();
                            break;
                        }
                        d.resolve(this.setCredentials(claims, model.token));
                        break;
                    case 'reference':
                        //Reference token type'da claim bilgilerini ayrıca aliyoruz
                        //Profile requesti 
                        this.getProfile(model.token).then(function (data) {
                            claims = self.jwthelper.extractClaims(data.data);
                            d.resolve(self.setCredentials(claims, model.token));
                        }, function () {
                            self.logger.warn('ReferenceToken profile request failed');
                            //Profile requesti başarisiz ise token bilglierini temizle
                            d.reject();
                        });
                        break;
                    default:
                        throw new Error('Unknown token type ' + this.securityConfig.oauthOptions.tokenType.toLowerCase());
                }
                //Sonuc
                return d.promise;
            },
            //Access tokne bilgisini rememberme paramina gore storage atar
            //Reuqesti headerina token'i ekler
            setAuthHeader: function (model) {
                var header = 'Bearer ' + model.token;
                //Mevcut Authorization objesini sil
                delete this.http.defaults.headers.common['Authorization'];
                //Bearer'i ekle
                this.http.defaults.headers.common['Authorization'] = header;
                //Token ve Refresh token 'i Validation ve refresh token işlemleri icin global bir değişkene atiyoruz
                this._tokens.token = model.token;
                this._tokens.refresh_token = model.refresh_token || this._tokens.refresh_token;
                //LocalStorage'a kayit ediyoruz
                this.caching.saveToCache(this.securityConfig.tokenStorageName, this._tokens);
                this.caching.saveToCache(this.securityConfig.usernameStorageName, model.username);
            },
            //Verilen user parametrelere gore cookie'ye kayi atarak login işlemini yapar
            setCredentials: function (data, token) {
                //Profile requestinden donen tum modeli currentUser'a extend et
                //NOT : CurrentUser value provider olrak inject edilebilir.
                this.currentUser = angular.extend(this.currentUser || {}, data);
                this.logger.info('User logged-in as ' + this.currentUser.name, this.currentUser);
                //Eger unauthorized request varsa headerlarini guncelleyip tekrar requestleri caliştiriyoruz
                this.retryQueue.retryAll(function (config) {
                    config.headers.Authorization = 'Bearer ' + token;
                    //Eger ping requesti ise token arg'i replace ediyoruz
                    if (config.pingRequest)
                        config.url = config.url.replace(/(token=)[^\&]+/, '$1' + token);
                    return config;
                });
                //Kullanici login oldugunda event firlat
                this.rootScope.$broadcast(this.config.events.userLoginChanged, this.currentUser);
                //Sonuc
                return this.currentUser;
            },
            //#endregion

            //#region LogOff
            //Ugulamadan cik
            exitApp: function () {
                this.logger.warn('app quit');
                ionic.Platform.exitApp();
            },
            //Logoff işlemi
            logOff: function () {
                //Oncelikle client logoff
                this.clearCredentials();
                //Flow tipine gore logoff
                this.handleUnAuthorized();
            },
            //Kullanici logoff oldugunda browserdan kullanici bilgilerini temizleyerek logoff işlemini yapar
            clearCredentials: function () {
                this.logger.warn('All authorization token and user info cleared');
                //document.execCommand("ClearAuthenticationCache");
                //Storage'lardan token bilgisi sil
                this.caching.removeCache(this.securityConfig.tokenStorageName);
                //Auhorization objesini sil
                delete this.http.defaults.headers.common['Authorization'];
                //CurrentUser reset
                this.currentUser = null;
                //Token reset
                this._tokens = {};
                //Bekleyen requestleri reject ediyoruz
                this.retryQueue.rejectAll();
            },
            //#endregion

            //#region Check App
            //Gecersiz versiyonda calişiyorsunuz eventi
            _invalidVersion: function (currentVer) {
                var self = this;
                this.logger.warn('app ver is not uptodate and about to quit');
                this.commonui.showAlert(this.localization.get("rota.verhatali", currentVer)).then(function () {
                    //TODO:Plugin kullanarak markette direk o uygulamnin sayfasina konumlan
                    self.exitApp();
                });
            },
            //Eger uygulama disabled ise mesaj verip cikiyoruz
            _appDisabled: function () {
                var self = this;
                this.logger.warn('app is disabled and about to quit');
                this.commonui.showAlert(this.localization.get("rota.uygdurduruldu")).then(function () {
                    self.exitApp();
                });
            },
            //Uygulama hakkında genel bilglieri ceker
            checkApp: function () {
                return this.config.appCheckEnabled ? (this.appPromise || this._checkApp()) : this.common.promise();
            },
            //Get app settings
            _checkApp: function () {
                var self = this;
                return this.appPromise = this.getAppData().then(function (data) {
                    //Enabled check
                    if (!data.enabled) {
                        //Fire invalid version found !!
                        self._appDisabled();
                        //Rejected promise
                        return self.common.rejectedPromise("app_disabled");
                    };
                    //Version check
                    if (data.version != self.config.appVersion) {
                        //Fire invalid version found !!
                        self._invalidVersion(data.version);
                        //Rejected promise
                        return self.common.rejectedPromise("invalid_version");
                    };
                    return data;
                });
            },
            //Get app data from server data
            getAppData: function () {
                var self = this,
                    backend = this.common.concatAndResolveUrl(this.config.defaultApiUrl, this.config.appCheckBackendUrl);
                //Request
                return this.http.get(backend).then(function (data) {
                    return self.appData = data.data;
                });
            },
            //#endregion

            //#region Init
            //Token bilgisine gore aktif kullanıcı bilglierini yukler
            initSecurity: function () {
                //Log
                this.logger.info('Security is initiated with AllowAnonymousAccess ' +
                    (this.securityConfig.allowAnonymousAccess ? 'true' : 'false') +
                    ' and TokenType ' + this.securityConfig.oauthOptions.tokenType);
                //Persistent storage'dan token bilgisini al
                var tokenModel = this.caching.restoreFromCache(this.securityConfig.tokenStorageName);
                //Eger token daha onceden kayit edildiyse
                if (this.common.isAssigned(tokenModel)) {
                    //Token ve Claim bilgilerini ayarla
                    return this.handleUserModelPromise = this.handleUserModel(tokenModel);
                }
                //Authorization yok
                return this.handleUserModelPromise = this.q.when(null);
            },
            //Constructor
            init: function (rootScope, http, q, retryQueue, securityConfig,
                modal, config, common, commonui, localization, caching,
                plugins, logger, jwthelper, securityconsts, currentuser) {
                //Base constructor
                this._super();
                //Angular DI members
                this.rootScope = rootScope;
                this.http = http;
                this.q = q;
                //Rota DI members
                this.currentUser = currentuser;
                this.retryQueue = retryQueue;
                this.securityConfig = securityConfig;
                this.modal = modal;
                this.config = config;
                this.common = common;
                this.commonui = commonui;
                this.localization = localization;
                this.caching = caching;
                this.plugins = plugins;
                this.logger = logger;
                this.jwthelper = jwthelper;
                this.securityconsts = securityconsts;
                //Token ve Refresh token
                this._tokens = {};
                //Login ekranı modal olarak goster
                var self = this;
                rootScope.$on(config.events.loginRequired, function () {
                    self.handleUnAuthorized();
                });
            }
            //#endregion
        });
        //#region Register
        //Register security service
        //Dialogs servisi sadece "Loading overlay" icin eklendi
        angular.module('rota.security.service', [])
            .factory('Security', ['$rootScope', '$http', '$q', 'RetryQueue', 'SecurityConfig',
                'Modal', 'Config', 'Common', 'CommonUI', 'Localization', 'Caching', 'Plugins', 'Logger',
                'JWTHelper', 'SecurityConsts', 'CurrentUser', 'Dialogs',
                function (rootScope, http, q, retryQueue, securityConfig, modal, config,
                           common, commonui, localization, caching, plugins, logger, jwthelper,
                           securityconsts, currentuser) {
                    var instance = new Security(rootScope, http, q, retryQueue, securityConfig, modal, config,
                                                common, commonui, localization, caching, plugins, logger, jwthelper,
                                                securityconsts, currentuser);
                    return instance;
                }
            ])
            .run(['Security', function (security) {
                //Bir onceki session'dan eger varsa kullanici bilgilerini yukle
                security.initSecurity();
            }]);
        //#endregion
        //#endregion

        //#region Current User
        angular.module('rota.security.service').value('CurrentUser', {});
        //#endregion

        //#region JWT & Claim Helper 
        var JWTHelper = BaseService.extend({
            //JWS promise
            signaturePromise: null,
            //Constructor
            init: function ($http, $q, securityconfig, logger, securityconsts) {
                this._super();

                this.q = $q;
                this.http = $http;
                this.securityconfig = securityconfig;
                this.logger = logger;
                this.securityconsts = securityconsts;
            },
            //Token'dan claim bilgilerini alir
            getClaims: function (token) {
                var jws = new KJUR.jws.JWS();
                var valid = jws.parseJWS(token);
                return JSON.parse(jws.parsedJWS.payloadS);
            },
            //Access token claim decode
            decodeJWT: function (token) {
                var claims = this.getClaims(token);
                return this.extractClaims(claims);
            },
            //JWT kontrol
            verifyJWT: function (token) {
                var d = this.q.defer(),
                    self = this;
                //JWS
                this.signaturePromise.then(function (cert) {
                    try {
                        var jws = new KJUR.jws.JWS();
                        var result = jws.verifyJWSByPemX509Cert(token, cert);
                        if (result) {
                            self.logger.info('JWT is valid');
                            d.resolve();
                        } else {
                            self.logger.error('JWT is not valid');
                            d.reject();
                        }
                    } catch (ex) {
                        self.logger.error('JWT is not valid', ex);
                        d.reject();
                    }
                });
                return d.promise;
            },
            //User defined claimleri dondurur
            extractClaims: function (claims) {
                var result = {};
                //Openid builtin claimleri cikartiyoruz
                for (var claim in claims) {
                    if (!_.contains(this.securityconsts.openIdBuiltInClaims, claim)) {
                        result[claim] = claims[claim];
                    }
                }
                return result;
            },
            //JWS alma methodu
            initJWTSignature: function () {
                var url = this.securityconfig.oauthOptions.loginBaseUri + this.securityconfig.jwtSignatureEndPoint;
                this.signaturePromise = this.http.get(url).then(function (response) {
                    return response.data.keys[0].x5c[0];
                });
            }
        });

        //#region Register
        angular.module('rota.security.jwthelper', [])
        .factory('JWTHelper', ['$http', '$q', 'SecurityConfig', 'Logger', 'SecurityConsts',
            function ($http, $q, securityconfig, logger, securityconsts) {
                var instance = new JWTHelper($http, $q, securityconfig, logger, securityconsts);
                return instance;
            }
        ]).run([
            'JWTHelper', 'SecurityConfig', function (jwtHelper, securityconfig) {
                //id_token parse edilecekse JWS alma methodunu cagir
                if (securityconfig.oauthOptions.tokenType.toLowerCase() == 'jwt') {
                    jwtHelper.initJWTSignature();
                }
            }
        ]);
        //#endregion
        //#endregion

        //#region Retry Queue
        //Authenticated olmayan requestleri tekrar denemek icin saklar 
        var RetryQueue = BaseService.extend({
            //#region Props
            //DI members
            $http: null,
            $injector: null,
            buffer: [],
            //#endregion

            //#region Methods
            //Config parametresine gore verilen requesti tekrar ceker
            retryHttpRequest: function (config, deferred) {
                function successCallback(response) {
                    deferred.resolve(response);
                }
                function errorCallback(response) {
                    deferred.reject(response);
                }

                this.logger.log('Retrying the request', config);
                this.$http = this.$http || this.$injector.get('$http');
                this.$http(config).then(successCallback, errorCallback);
            },
            //Verilen reuqesti buffera ekler
            append: function (response, deferred) {
                this.buffer.push({
                    response: response,
                    deferred: deferred
                });
                this.logger.info('Request is queued for authorization', response);
            },
            //Kuyrukta bekleyen tum requestleri tekrar ceker
            retryAll: function (updater) {
                for (var i = 0; i < this.buffer.length; ++i) {
                    this.retryHttpRequest(updater(this.buffer[i].response.config), this.buffer[i].deferred);
                }
                this.buffer = [];
            },
            //Kuyrukta bekleyen tum requestleri iptal eder
            rejectAll: function () {
                for (var i = 0; i < this.buffer.length; ++i) {
                    this.buffer[i].deferred.reject(this.buffer[i].response);
                }
                this.buffer = [];
                this.logger.warn('All unauthorized requests have been rejected');
            },
            //#endregion

            //#region Init
            //Constructor
            init: function ($injector, logger) {
                //Base constructor
                this._super();
                //DI members
                this.$injector = $injector;
                this.logger = logger;
            }
            //#endregion
        });
        //#region Register
        //Register
        angular.module('rota.security.retryQueue', []).factory('RetryQueue', ['$injector', 'Logger',
            function ($injector, logger) {
                var instance = new RetryQueue($injector, logger);
                return instance;
            }]);
        //#endregion
        //#endregion

        //#region Security Interceptor
        //Server yetkilendirmesi icin kullanilan Http response interceptor'u
        //Eğer UnAuthorizated 401 bilgisi serverdan donerse Login ekranı gelicek
        angular.module('rota.security.interceptor', ['rota.security.retryQueue'])
             .config(['$httpProvider', function ($httpProvider) {
                 var interceptor = ['$rootScope', '$q', 'RetryQueue', 'Config', 'Logger', 'Events',
                     function ($rootScope, $q, retryQueue, config, logger, events) {
                         var self = {};
                         //TODO:Belki sonra devreye alinabilir
                         //self.request = function (reqConfig) {
                         //Offline check
                         //if (events.isNetworkOffline()) {
                         //    logger.log('Request is skipped due to offline network status ' + reqConfig.url, reqConfig);
                         //    //Cancel request
                         //    var canceler = $q.defer();
                         //    reqConfig.timeout = canceler.promise;
                         //    canceler.resolve();
                         //} else {
                         //    logger.log('Request is started to ' + reqConfig.url, reqConfig);
                         //}

                         //    return reqConfig || $q.when(reqConfig);
                         //},
                         self.responseError = function (response) {
                             //Eger yetkisiz bir işlem yapıldıysa
                             if ((response.status === 401 && !response.config.ignoreAuthModule) ||
                                 (response.status === 400 && response.config.pingRequest)) {
                                 //Yeni promise yarat ve queue ye ekle
                                 var deferred = $q.defer();
                                 retryQueue.append(response, deferred);
                                 //Login-required eventini broadcast et
                                 $rootScope.$broadcast(config.events.loginRequired);
                                 return deferred.promise;
                             }
                             // Varsayilan response
                             return $q.reject(response);
                         };

                         return self;
                     }];

                 $httpProvider.interceptors.push(interceptor);
             }]);
        //#endregion

        //#region Security Module Dependency Index
        //Security module index
        angular.module('rota.services.security',
        [
            'rota.security.consts',
            'rota.security.jwthelper',
            'rota.security.service',
            'rota.security.interceptor',
            'rota.security.retryQueue',
            'rota.security.config'
        ]);
        //#endregion
    });