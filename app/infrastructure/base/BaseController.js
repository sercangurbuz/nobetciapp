'use strict';

define(['Class', 'underscore'], function (Class, _) {
    //Tum Controller icin base ozellikleri iceren base controller
    var BaseController = Class.extend({
        //#region Register event 
        //Controller icinde register olmus eventler
        registeredEvents: null,
        //Verilen parametrelere gore event register eder
        registerEvent: function (eventName, fn) {
            if (!this.scope) {
                throw new Error('Scope cant be null while registering event');
            }
            //Register and store - 
            //Scope destroy oldugunda eventi deregister yapmak icin off fn yi sakliyoruz bkz:destroy event
            this.registeredEvents.push(this.scope.$on(eventName, fn));
        },
        //#endregion

        //#region Base Common Methods
        //Undefined ve bull degilse
        isAssigned: function (value) {
            return this.common.isAssigned(value);
        },
        //Verilen string ifadenin null veya boşluk olmasi durumunu kontrol eder
        isNullOrEmpty: function (value) {
            return this.common.isNullOrEmpty(value);
        },
        //Verilen textin aktif dildeki karşiligini verir
        getLocal: function (key, params) {
            return key && this.localization.get(key, params);
        },
        //Extend Obj
        extend: function (src, dest) {
            return _.extend(src, dest);
        },
        //Go back
        goBack: function () {
            return this.ionicNavBarDelegate.back();
        },
        //Route yonlendirme
        go: function (path, params) {
            this.routing.go(path, params);
        },
        //BasePath
        basePath: function (fileName) {
            var fullPath = this.config.basePath;
            return this.common.addTrailingSlash(fullPath) + fileName;
        },
        //Aktif route'un path bilgisini verir
        path: function (fileName) {
            var fullPath = this.routing.current.loadedTemplateUrl,
                routeName = fullPath.split('/').pop();
            return fullPath.replace(routeName, fileName || '');
        },
        //#endregion

        //#region Dialogs & UI
        //Show alert
        showAlert: function (message, title, buttonName) {
            return this.commonui.showAlert(message, title, buttonName);
        },
        //Show alert
        showConfirm: function (message, title, okButtonText, cancelButtonText) {
            return this.commonui.showConfirm(message, title, okButtonText, cancelButtonText);
        },
        //Show alert
        showPrompt: function (message, title, defaultText) {
            return this.commonui.showPrompt(message, title, defaultText);
        },
        //Show Actionsheet
        showActionSheet: function (title, buttonLabels, showCancelButton, destructiveButtonText) {
            return this.commonui.showActionSheet(title, buttonLabels, showCancelButton, destructiveButtonText);
        },
        //Show ActionSheet Popup
        showActionSheetPopup: function (title, buttonLabels, showCancelButton, cancelButtonText) {
            return this.dialogs.showActionSheetPopup(title, buttonLabels, showCancelButton, cancelButtonText);
        },
        //Show Toast
        showToast: function (message) {
            return this.commonui.showToast(message);
        },
        //Show popover
        showPopover: function (cntEvent, templateUrl, options) {
            return this.modal.showPopover(cntEvent, templateUrl, options);
        },
        //Modal pencereyi goster
        /*Parametreler - options
                    templateUrl --> useBasePath parametresine gore view'in relative path'i
                    model --> Modal pencerenin kullanicagi data-model
                    scope --> The scope to be a child of. Default: creates a child of $rootScope.
                    animation --> The animation to show & hide with. Default: 'slide-in-up'
                    focusFirstInput --> Whether to autofocus the first input of the modal when shown. Default: false.
                    backdropClickToClose --> Whether to close the modal on clicking the backdrop. Default: true.
                    hardwareBackButtonClose --> Whether the modal can be closed using the hardware back button on Android and similar devices. Default: true.*/
        showModal: function (templateUrl, data, options) {
            return this.modal.showModal(templateUrl, data, options);
        },
        //Popup formmu ekrana getirir
        //showPopup(options)
        //showPopup(title, template, successCallback, okButtonText, showCancelButton, cancelButtonText)
        showPopup: function (title, template, successCallback, okButtonText, showCancelButton,
            cancelButtonText, cssClass) {
            if (angular.isObject(arguments[0]))
                return this.modal.showPopup(arguments[0]);
            else
                return this.modal.showStdPopup(this.scope, title, template, successCallback,
                    showCancelButton, okButtonText, cancelButtonText, cssClass);
        },
        //#endregion

        //#region Sharing
        //Paylaş
        share: function (message, title, file, url) {
            return this.plugins.share(message, title, file, url);
        },
        shareVia: function (platform, message, title, file, url) {
            return this.plugins.shareVia(platform, message, title, file, url);
        },
        //#endregion

        //#region Misc
        //Log
        log: function (msg, showToast) {
            this.logger.log(msg, showToast);
        },
        //Loading paneli goster
        showLoading: function (msg) {
            this.dialogs.showLoading(msg);
        },
        //Loading paneli gizle
        hideLoading: function () {
            this.dialogs.hideLoading();
        },
        //Verilen Texti clipboarda atar
        copyText: function (text) {
            return this.plugins.copyText(text);
        },
        //Safe $apply
        apply: function (fn) {
            var phase = this.scope.$root.$$phase;
            if (phase == '$apply' || phase == '$digest') {
                if (fn) {
                    this.scope.$eval(fn);
                }
            } else {
                if (fn) {
                    this.scope.$apply(fn);
                } else {
                    this.scope.$apply();
                }
            }
        },
        //Online event
        online: function () {
            this.scope.networkStatus.online = true;
            this.scope.networkStatus.offline = !this.scope.networkStatus.online;
        },
        //Offline event
        offline: function () {
            this.scope.networkStatus.online = false;
            this.scope.networkStatus.offline = !this.scope.networkStatus.online;
        },
        //#endregion

        //#region Http Methods
        //SignalR server methodu tetikle
        sendSignal: function (data, eventName, hubName, method) {
            var hub = this.signalR.hubs[hubName || this.config.defaultHubName],
                methodName = method || 'sendData';

            if (this.isAssigned(hub[methodName])) {
                return hub[methodName](data, eventName);
            }
            return null;
        },
        //SignalR eventi register eder
        receiveSignal: function (eventName, fn) {
            this.registerEvent(eventName, function (event, data) {
                fn && fn(data);
            });
        },
        //Get verb
        get: function (url, params) {
            return this.http.get(url, params).then(function (data) {
                return data.data;
            });
        },
        //Post verb
        post: function (url, params) {
            return this.http.post(url, params);
        },
        //#endregion

        //#region Underscore stuffs
        //Filtreye fore eşleşen kayitlari dondurur
        findAll: function (srcArray, filterObj) {
            return _.where(srcArray, filterObj);
        },
        //Filtreye fore eşleşen kayidı (ilk kayidi) dondurur
        find: function (srcArray, filterObj) {
            return _.findWhere(srcArray, filterObj);
        },
        //#endregion

        //#region Initialization Methods
        //Event leri register eder
        registerEvents: function () {
            //Destroy listenerini register et
            this.registeredEvents = [];
            this.registerEvent("$destroy", this.destroy.bind(this));
            //View yuklendikten sonra tetiklenen event
            if (typeof this.enter === "function")
                this.registerEvent("$ionicView.enter", this.enter.bind(this));
            //Resume event
            if (typeof this.resume === "function")
                this.registerEvent(this.config.events.resume, this.resume.bind(this));
            //Pause event
            if (typeof this.pause === "function")
                this.registerEvent(this.config.events.pause, this.pause.bind(this));
            //Online event
            this.registerEvent(this.config.events.online, this.online.bind(this));
            //Offline event
            this.registerEvent(this.config.events.offline, this.offline.bind(this));
            //Exception event
            if (typeof this.exception === "function")
                this.registerEvent(this.config.events.onexception, this.exception.bind(this));
        },
        //Controller angular tarfindan kullanlmadigi zaman tetiklenen method
        destroy: function () {
            //Deregister events
            this.registeredEvents.forEach(function (fn) {
                fn();
            });
            //Event Listesini temizle
            this.registeredEvents = [];
        },
        //Property'leri tanımla
        defineProperties: function () {
            //Notifications
            var self = this;
            //Model
            Object.defineProperty(this, 'model', {
                configurable: true,
                get: function () {
                    return this.scope.model;
                },
                set: function (value) {
                    this.scope.model = value;
                }
            });
            Object.defineProperty(this, 'params', {
                configurable: false,
                get: function () {
                    return self.routing.$stateParams;
                }
            });
            //Aktif dili verir
            Object.defineProperty(this, 'language', {
                configurable: false,
                get: function () {
                    return self.localization.language;
                }
            });
            //activeLanguageName
            Object.defineProperty(this.scope, 'activeLanguageFriendlyName', {
                configurable: false,
                enumerable: false,
                get: function () {
                    switch (this.selectedLanguage) {
                        case 'en-us':
                            return 'English';
                        default:
                            return 'Türkçe';
                    }
                }
            });
            //activeLanguageName
            Object.defineProperty(this.scope, 'selectedLanguage', {
                configurable: false,
                enumerable: false,
                get: function () {
                    return self.localization.language;
                }
            });
        },
        //Scope'a data ekler - //extend scope - Ust siniflarda this._super() yazmayi unutmamk lazim !!!
        extendScope: function () {
            //Backward capability for scope in using view 
            //this.scope.scope = this.scope;
            //Go back ! Modal oldugunda modali kapatir veya bir onceki route'a doner
            this.scope.goBack = this.goBack.bind(this);
            //Path event
            this.scope.path = this.path.bind(this);
            //Show Popover event
            this.scope.showPopover = this.showPopover.bind(this);
            //Offline status
            this.scope.networkStatus = { online: true, offline: false };
        },
        //tum servisleri basecontroller memberi olarak set eder
        initBundle: function (bundle) {
            this.rootScope = bundle.$rootScope;
            this.scope = bundle.$scope;
            this.q = bundle.$q;
            this.http = bundle.$http;
            this.ionicLoading = bundle.$ionicLoading;
            this.ionicModal = bundle.$ionicModal;
            this.ionicNavBarDelegate = bundle.$ionicNavBarDelegate;
            this.modal = bundle.modal;
            this.config = bundle.config;
            this.localization = bundle.localization;
            this.dialogs = bundle.dialogs;
            this.routing = bundle.routing;
            this.caching = bundle.caching;
            this.signalR = bundle.signalR;
            this.common = bundle.common;
            this.commonui = bundle.commonui;
            this.plugins = bundle.plugins;
            this.logger = bundle.logger;
        },
        //Controller constructor
        init: function (bundle) {
            //DI members
            this.initBundle(bundle);
            //extend scope - Ust siniflarda this._super() yazmayi unutmamk lazim !!!
            this.extendScope();
            //Property'leri tanımlıyoruz - Ust siniflarda this._super() yazmayi unutmamk lazim !!!
            this.defineProperties();
            //Varsayilan signalR disabled
            this.enableSignalR = false;
            //Event leri register eder
            this.registerEvents();
        }
        //#endregion
    });
    //BaseController döndür
    return BaseController;
});
