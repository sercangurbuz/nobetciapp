'use strict';

define(['angular', 'base/BaseService', 'underscore'], function (angular, BaseService, _) {
    //Dilaog Service
    var PluginService = BaseService.extend({
        //#region Contact Plugin
        //Search contacts
        /*id: A globally unique identifier. (DOMString)
          displayName: The name of this Contact, suitable for display to end users. (DOMString)
          name: An object containing all components of a persons name. (ContactName)
          nickname: A casual name by which to address the contact. (DOMString)
          phoneNumbers: An array of all the contact's phone numbers. (ContactField[])
          emails: An array of all the contact's email addresses. (ContactField[])
          addresses: An array of all the contact's addresses. (ContactAddress[])
          ims: An array of all the contact's IM addresses. (ContactField[])
          organizations: An array of all the contact's organizations. (ContctOrganization[])
          birthday: The birthday of the contact. (Date)
          note: A note about the contact. (DOMString)
          photos: An array of the contact's photos. (ContactField[])
          categories: An array of all the user-defined categories associated with the contact. (ContactField[])
          urls: An array of web pages associated with the contact. (ContactField[])*/
        findContacts: function (value) {
            var d = this.q.defer(),
                options = new ContactFindOptions();

            options.filter = value;
            options.multiple = true;
            var filter = [navigator.contacts.fieldType.displayName];

            navigator.contacts.find(filter, function (contacts) {
                d.resolve(contacts);
            }, function (error) {
                d.reject(error);
            }, options);

            return d.promise;
        },
        //
        findContactsWithPhoneNumber: function (value) {
            return this.findContacts(value).then(function (contacts) {
                return _.filter(contacts, function (contact) {
                    return contact.phoneNumbers && contact.phoneNumbers.length > 0;
                });
            });
        },
        //#endregion

        //#region Sharing
        share: function (message, title, file, url) {
            var self = this,
                d = this.q.defer();

            window.plugins.socialsharing.share(message, title, file, url,
                function (result) {
                    if (result)
                        d.resolve(result);
                    else
                        d.reject(result);
                }, function (result) {
                    self.showToast(self.localization.get('rota.paylasimdahata', result));
                    d.reject(result);
                }
            );

            return d.promise;
        },
        //Share via
        shareVia: function (platform, message, title, file, url) {
            var self = this,
                d = this.q.defer();

            window.plugins.socialsharing.shareVia(platform, message, title, file, url,
                function (result) {
                    if (result)
                        d.resolve(result);
                    else
                        d.reject(result);
                }, function (result) {
                    self.showToast(self.localization.get('rota.paylasimdahata', result));
                    d.reject(result);
                }
            );

            return d.promise;
        },
        //#endregion

        //#region Dialogs
        //Show alert
        showAlert: function (message, title, buttonLabel) {
            var d = this.q.defer();

            navigator.notification.alert(message, function () {
                d.resolve();
            }, title || this.config.projectTitle, buttonLabel || this.localization.get('rota.tamam'));

            return d.promise;
        },
        //Show confirm 
        showConfirm: function (message, title, okButtonText, cancelButtonText) {
            var d = this.q.defer();

            navigator.notification.confirm(message, function (buttonIndex) {
                if (buttonIndex === 2)
                    d.resolve(buttonIndex);
                else
                    d.reject(buttonIndex);
            }, title || this.localization.get('rota.onay'),
            [cancelButtonText || this.localization.get('rota.iptal'), okButtonText || this.localization.get('rota.tamam')]);

            return d.promise;
        },
        //Show Prompt
        showPrompt: function (message, title, defaultText) {
            var d = this.q.defer();

            navigator.notification.prompt(message, function (result) {
                if (result.buttonIndex === 2)
                    d.resolve(result.input1);
                else
                    d.reject(result.input1);
            }, title || this.config.projectTitle, [this.localization.get('rota.iptal'), this.localization.get('rota.tamam')], defaultText);

            return d.promise;
        },
        //Show Toast
        showToast: function (message) {
            var q = this.q.defer();
            this.window.plugins.toast.showShortBottom(message, function (response) {
                q.resolve(response);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        },
        //Show ActionSheet
        showActionSheet: function (title, buttonLabels, showCancelButton, destructiveButtonText) {
            var q = this.q.defer(),
                //Settings
                settings = {
                    title: title,
                    buttonLabels: buttonLabels,
                    androidEnableCancelButton: showCancelButton,
                    winphoneEnableCancelButton: showCancelButton,
                    addCancelButtonWithLabel: showCancelButton ? this.localization.get('rota.iptal') : undefined,
                    addDestructiveButtonWithLabel: destructiveButtonText
                },
                //Toplam option sayisi
                buttonCount = buttonLabels.length + (destructiveButtonText ? 1 : 0);
            //Show actionsheet
            window.plugins.actionsheet.show(settings,
                function (buttonIndex) {
                    if (buttonIndex <= buttonCount) {
                        //Optionlardan birini tiklandi
                        q.resolve(buttonIndex - 1);
                    } else {
                        //Iptal i?lemi
                        q.reject(buttonIndex - 1);
                    }
                }
            );
            return q.promise;
        },
        //#endregion

        //#region Clipboard
        copyText: function (text) {
            var d = this.q.defer();

            cordova.plugins.clipboard.copy(text, function () {
                d.resolve('OK');
            }, function () {
                d.reject('NAK');
            });

            return d.promise;
        },
        //#endregion

        //#region Constructor
        //Constructor
        init: function ($q, $window, config, localization) {
            this._super();
            this.q = $q;
            this.window = $window;
            this.config = config;
            this.localization = localization;
        }
        //#endregion
    });
    //#region Register
    //Register dialog service
    angular.module('rota.services.plugins', ['rota.services.localization']).factory('Plugins',
    [
        '$q', '$window', 'Config', 'Localization',
        function ($q, $window, config, localization) {
            var instance = new PluginService($q, $window, config, localization);
            return instance;
        }
    ]);
    //#endregion
});