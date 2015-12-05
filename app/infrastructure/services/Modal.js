'use strict';

define(['angular', 'base/BaseService', 'services/Localization', 'services/Common', 'config/Config'], function (angular, BaseService) {
    //Dilaog Service
    var ModalService = BaseService.extend({
        //#region Methods
        CANCELLED_ACTION: 'CANCELLED',
        //Show standart popup
        showStdPopup: function (scope, title, template, successCallback, showCancelButton, okButtonText, cancelButtonText, cssClass) {
            var self = this,
                defer = this.q.defer(),
                //Sadece title yeterli
                options = { title: title, scope: scope, cssClass: cssClass };
            //Html olmasi durumuna gore ilgili propa atama yapılıyor
            if (this.common.isHtml(template))
                options.templateUrl = template;
            else
                options.template = template;
            //Ok Buttonu
            options.buttons = [{
                text: '<b>' + (okButtonText || this.localization.get('rota.tamam')) + '</b>',
                type: 'button-positive',
                onTap: function (e) {
                    return successCallback && successCallback(e);
                }
            }];
            //Cancel Butonu
            if (showCancelButton) {
                options.buttons.push({
                    text: cancelButtonText || this.localization.get('rota.iptal'),
                    onTap: function (e) {
                        return self.CANCELLED_ACTION;
                    }
                });
            }
            //Popup
            var popup = this.ionicPopup.show(options);
            scope.popup = popup;
            //Sonuc
            popup.then(function (data) {
                if (data === self.CANCELLED_ACTION || data === undefined)
                    defer.reject(self.CANCELLED_ACTION);
                else
                    defer.resolve(data);
            }, function (data) {
                defer.reject(data);
            });
            return defer.promise;
        },
        //Show Popup
        showPopup: function (options) {
            return this.ionicPopup.show(options);
        },
        //Modal pencere goster
        showModal: function (template, options) {
            var self = this,
                defer = this.q.defer(),
                //Varsayilan modal options ayarlari
                defaultOptions = {
                    animation: 'slide-in-up',
                    focusFirstInput: true,
                    backdropClickToClose: true,
                    hardwareBackButtonClose: true
                },
                //Modal scope mothodalari
                modalScope = {
                    modalResult: function (result, $event) {
                        defer.resolve(result);
                        this.modal.remove();
                        $event && $event.preventDefault();
                    },
                    closeModal: function ($event) {
                        defer.reject('closeModal');
                        this.modal.remove();
                        $event && $event.preventDefault();
                    }
                };
            //Modal options
            var modalOptions = this.extend(defaultOptions, options);
            //Eger paramdena gelen scope bossa yeni scope yarat
            if (!this.isAssigned(modalOptions.scope))
                modalOptions.scope = this.rootScope.$new();
            //Modal Scope members
            modalOptions.scope = this.extend(modalOptions.scope, modalScope);
            // Hardware-back tusu
            modalOptions.scope.$on('modal.hidden', function () {
                defer.reject(self.CANCELLED_ACTION);
            });
            //ionicModal objesini olustur
            this.ionicModal.fromTemplateUrl(template, modalOptions).then(function (modal) {
                modalOptions.scope.modal = modal;
                //Modal pencereyi kaydet
                modal.show();
            });
            //Promise döndür - ModalResult
            return defer.promise;
        },
        //Show popover
        showPopover: function (cntEvent, templateUrl, options) {
            var defer = this.q.defer(),
                //Varsayilan modal options ayarlari
                defaultOptions = {
                    focusFirstInput: true,
                    backdropClickToClose: true,
                    hardwareBackButtonClose: true
                },
                //Modal scope mothodalari
                modalScope = {
                    modalResult: function (result, $event) {
                        defer.resolve(result);
                        this.modal.remove();
                        $event && $event.preventDefault();
                    },
                    closeModal: function ($event) {
                        defer.reject('closeModal');
                        this.modal.remove();
                        $event && $event.preventDefault();
                    }
                };
            //Modal options
            var modalOptions = this.extend(defaultOptions, options);
            //Eger paramdena gelen scope bossa yeni scope yarat
            if (!this.isAssigned(modalOptions.scope))
                modalOptions.scope = this.rootScope.$new();
            //Modal Scope members
            modalOptions.scope = this.extend(modalOptions.scope, modalScope);
            //ionicModal objesini olustur
            this.ionicPopover.fromTemplateUrl(templateUrl, modalOptions).then(function (modal) {
                modalOptions.scope.modal = modal;
                //Modal pencereyi kaydet
                modal.show(cntEvent);
            });
            //Promise döndür - ModalResult
            return defer.promise;
        },
        //#endregion

        //#region Init
        //Constructor
        init: function ($rootScope, $q, $window, $ionicModal, $ionicPopup, $ionicPopover, config, localization, common) {
            this._super();
            this.rootScope = $rootScope;
            //this.scope = $scope;
            this.q = $q;
            this.ionicModal = $ionicModal;
            this.ionicPopup = $ionicPopup;
            this.ionicPopover = $ionicPopover;
            this.window = $window;
            this.config = config;
            this.localization = localization;
            this.common = common;
        }
        //#endregion
    });
    //#region Register
    //Register Modal service
    angular.module('rota.services.modal', ['rota.services.localization']).factory('Modal',
    ['$rootScope', '$q', '$window', '$ionicModal', '$ionicPopup', '$ionicPopover', 'Config', 'Localization', 'Common',
        function ($rootScope, $q, $window, $ionicModal, $ionicPopup, $ionicPopover, config, localization, common) {
            var instance = new ModalService($rootScope, $q, $window, $ionicModal, $ionicPopup, $ionicPopover, config, localization, common);
            return instance;
        }
    ]);
    //#endregion

})