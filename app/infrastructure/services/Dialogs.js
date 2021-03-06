'use strict';

define(['angular', 'base/BaseService', 'underscore', 'signaturepad'], function (angular, BaseService, _, signaturepad) {
    //Dilaog Service
    var DialogService = BaseService.extend({
        //#region Methods
        CANCELLED_ACTION: 'CANCELLED',
        //Show alert
        showAlert: function (message, title, okButtonText) {
            return this.ionicPopup.alert({
                title: '<b>' + (title || this.config.projectTitle) + '</b>',
                template: message,
                okType: 'button-positive',
                okText: '<b>' + (okButtonText || this.localization.get('rota.tamam')) + '</b>',
            });
        },
        //Show confirm 
        showConfirm: function (message, title, okButtonText, cancelButtonText) {
            var self = this,
                d = this.q.defer();

            this.ionicPopup.confirm({
                title: '<b>' + (title || this.localization.get('rota.onay')) + '</b>',
                template: message,
                okType: 'button-positive',
                okText: '<b>' + (okButtonText || this.localization.get('rota.tamam')) + '</b>',
                cancelText: cancelButtonText || this.localization.get('rota.iptal')
            }).then(function (data) {
                if (data)
                    d.resolve();
                else
                    d.reject(self.CANCELLED_ACTION);
            });

            return d.promise;
        },
        //Show Prompt
        showPrompt: function (message, title, inputType, inputPlaceholder, okButtonText, cancelButtonText) {
            var self = this,
                d = this.q.defer();

            this.ionicPopup.prompt({
                title: '<b>' + (title || this.localization.get('rota.degergirin')) + '</b>',
                template: message,
                inputType: inputType,
                inputPlaceholder: inputPlaceholder,
                okType: 'button-positive',
                okText: '<b>' + (okButtonText || this.localization.get('rota.tamam')) + '</b>',
                cancelText: cancelButtonText || this.localization.get('rota.iptal')
            }).then(function (data) {
                if (data)
                    d.resolve(data);
                else
                    d.reject(self.CANCELLED_ACTION);
            });
            return d.promise;
        },
        //Show ActionSheet
        showActionSheet: function (title, buttonLabels, showCancelButton, destructiveButtonText) {
            var d = this.q.defer(),
                //Settings
                settings = {
                    buttons: buttonLabels.map(function (item) {
                        return { text: item };
                    }),
                    destructiveText: destructiveButtonText,
                    titleText: title,
                    buttonClicked: function (index) {
                        d.resolve(index);
                        //Kapat
                        return true;
                    },
                    cancel: function () {
                        d.reject('Cancelled');
                    },
                    destructiveButtonClicked: function () {
                        d.resolve(-1);
                        //Kapat
                        return true;
                    }
                };
            //Iptal butonu
            if (showCancelButton)
                settings = this.extend(settings, { cancelText: this.localization.get('rota.iptal') });
            //Destructive button
            if (destructiveButtonText)
                settings = this.extend(settings, { destructiveText: destructiveButtonText });
            //ActionSheet goster
            this.ionicActionSheet.show(settings);
            //Sonuc
            return d.promise;
        },
        //Show ActionShhet as Popup
        showActionSheetPopup: function (title, buttonLabels, showCancelButton, cancelButtonText) {
            var self = this,
                defer = this.q.defer(),
                //Sadece title yeterli
                options = { title: title, scope: this.rootScope.$new(), buttons: [] };
            //ButtonLabellari scope'a ekle
            options.scope.actionSheetItems = buttonLabels;
            //Cancel Butonu
            if (showCancelButton) {
                options.buttons.push(
                    {
                        text: cancelButtonText || this.localization.get('rota.iptal'),
                        type: 'button-assertive',
                        onTap: function (e) {
                            return self.CANCELLED_ACTION;
                        }
                    }
                );
            };
            //Html olmasi durumuna gore ilgili propa atama yap�l�yor
            options.template = '<style>.popup-body {padding: 0;}' + (showCancelButton ? '' : '.popup-buttons { min-height:0; }') + '</style>' +
                '<div class="list"><a class="item" href="#" on-tap="modal.close($index);$event.preventDefault();" ng-repeat="asItem in actionSheetItems">{{asItem}}</a></div>';
            //Modal pencereyi scope'a at listeden kapatilabilsin diye
            options.scope.modal = this.ionicPopup.show(options);
            //Modal pencereyi geri dondur
            return options.scope.modal.then(function (data) {
                if (data === self.CANCELLED_ACTION)
                    defer.reject(self.CANCELLED_ACTION);
                else
                    defer.resolve(data);

                return defer.promise;
            });
        },
        //Loading paneli goster
        showLoading: function (msg) {
            this.ionicLoading.show({
                template: msg || this.localization.get('rota.lutfenbekleyiniz')
            });
        },
        //Loading paneli gizle
        hideLoading: function () {
            this.ionicLoading.hide();
        },
        //IonicLoading panelini toast olarak kullaniyoruz
        showToast: function (msg) {
            this.ionicLoading.show({
                template: msg,
                noBackdrop: true,
                duration: 1500
            });
        },
        //Cropping Picture
        cropPicture: function (options) {
            if (!options.imageUrl) throw "imageUrl needed for cropping";

            return this.$jrCrop.crop({
                url: options.imageUrl,
                circle: options.circle || false,
                width: options.width || 200,
                height: options.height || 200,
                cancelText: '�ptal',
                chooseText: 'Tamam'
            }).then(function (canvas) {
                return canvas.toDataURL('image/jpeg', 1.0);
            });
        },
        //Show Signature Form
        showSignatureForm: function () {
            var self = this,
                markup = '<ion-modal-view cache-view="false"><div class="bar bar-header bar-assertive">' +
                        '<h1 class="title">Imza Formu</h1></div><ion-content class="has-header" scroll="false">' +
                        '<signature-pad></signature-pad>' +
                        '<button class="button button-full button-outline button-positive" ng-click="save()">Tamam</button>' +
                        '<button class="button button-full button-outline button-assertive" ng-click="closeModal()">�ptal</button>' +
                        '</ion-content></ion-modal-view>',
                scope = this.rootScope.$new(false);

            //Scope methods
            scope.save = function () {
                if (scope.model.signaturePad.isEmpty()) {
                    self.showToast('Lutfen imza atiniz');
                } else {
                    var data = scope.model.signaturePad.toDataURL("image/jpeg");
                    scope.modalResult(data);
                }
            };
            scope.model = {};
            //Show modal
            return this.modal.showModal(markup, { scope: scope });
        },
        //#endregion

        //#region Init
        //Constructor
        init: function ($rootScope, $q, $window, $ionicPopup, $ionicActionSheet, $ionicLoading, $jrCrop, config, localization, modal) {
            this._super();

            this.rootScope = $rootScope;
            this.q = $q;
            this.ionicLoading = $ionicLoading;
            this.ionicPopup = $ionicPopup;
            this.ionicActionSheet = $ionicActionSheet;
            this.window = $window;
            this.config = config;
            this.localization = localization;
            this.$jrCrop = $jrCrop;
            this.modal = modal;
            //Loading Panel register events
            var self = this;
            $rootScope.$on(config.events.ajaxStarted, function () {
                self.showLoading();
            });
            $rootScope.$on(config.events.ajaxFinished, function () {
                self.hideLoading();
            });
        }
        //#endregion
    });
    //#region Register
    //Register dialog service
    angular.module('rota.services.dialogs', ['rota.services.localization', 'jrCrop']).factory('Dialogs',
    ['$rootScope', '$q', '$window', '$ionicPopup', '$ionicActionSheet', '$ionicLoading', '$jrCrop', 'Config', 'Localization', 'Modal',
        function ($rootScope, $q, $window, $ionicPopup, $ionicActionSheet, $ionicLoading, $jrCrop, config, localization, modal) {
            var instance = new DialogService($rootScope, $q, $window, $ionicPopup,
                $ionicActionSheet, $ionicLoading, $jrCrop, config, localization, modal);
            return instance;
        }
    ]);
    //#endregion

})