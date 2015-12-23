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

        //#region SqlLite
        //Open db
        openDb: function (dbName, initQueries) {
            var db = this.window.sqlitePlugin.openDatabase({ name: dbName, location: 2 });
            if (initQueries) {
                var p = this.execSqls(db, initQueries);
                return {
                    db: db,
                    promise: p
                };
            }
            return db;
        },
        //Delete DB
        deleteDB: function (dbName) {
            var q = this.q.defer();

            this.window.sqlitePlugin.deleteDatabase(dbName, function (success) {
                q.resolve(success);
            }, function (error) {
                q.reject(error);
            });
            return q.promise;
        },
        //Execute SQL statement
        execSql: function (db, query, binding) {
            var q = this.q.defer();
            db.transaction(function (tx) {
                tx.executeSql(query, binding, function (tx, result) {
                    q.resolve(result);
                },
                  function (transaction, error) {
                      q.reject(error);
                  });
            });
            return q.promise;
        },
        //
        execSqls: function (db, queries) {
            var self = this,
                d = this.q.defer();
            db.transaction(function (tx) {
                var qAll = [];
                for (var i = 0; i < queries.length ; i++) {
                    var queryItem = queries[i];

                    if (!queryItem) continue;
                    if (!queryItem.query) continue;

                    (function (item) {
                        var q = self.q.defer();
                        console.log('executing query ' + item.query);
                        tx.executeSql(item.query, item.binding, function (tx, result) {
                            q.resolve(result);
                            console.log('executed query', result);
                        }, function (transaction, error) {
                            q.reject(error);
                            console.log('failed query', error);
                        });
                        qAll.push(q.promise);
                    })(queryItem);
                }
                self.q.all(qAll).then(function (data) {
                    console.log('all request resoved');
                    d.resolve(data);
                });
            });
            return d.promise;
        },
        //#endregion

        //#region Camera
        //var options = {
        //    quality: 50,0-100
        //    destinationType: Camera.DestinationType.DATA_URL,FILE_URI,NATIVE_URI
        //    sourceType: Camera.PictureSourceType.CAMERA,PHOTOLIBRARY,SAVEDPHOTOALBUM
        //    allowEdit: true,
        //    encodingType: Camera.EncodingType.JPEG,
        //    targetWidth: 100,
        //    targetHeight: 100,
        //    popoverOptions: CameraPopoverOptions,
        //    saveToPhotoAlbum: false,
        //    correctOrientation:true
        //};
        getPicture: function (options) {
            var self = this;
            //Removes intermediate image files that are kept in temporary storage after calling camera.getPicture
            function cleanUp() {
                var q = self.q.defer();
                navigator.camera.cleanup(function () {
                    q.resolve(null);
                }, function (err) {
                    q.reject(err);
                });
                return q.promise;
            }
            //Call camera plugin to obtain picture
            function callPlugin(settings) {
                var q = self.q.defer();
                if (!navigator.camera) {
                    q.resolve(null);
                    return q.promise;
                }
                navigator.camera.getPicture(function (imageData) {
                    var prefix = settings.destinationType === Camera.DestinationType.DATA_URL ? 'data:image/jpeg;base64,' : '';
                    q.resolve(prefix + imageData);
                }, function (err) {
                    q.reject(err);
                }, settings);

                return q.promise.finally(function () {
                    if (settings.destinationType === Camera.DestinationType.FILE_URI &&
                        settings.sourceType === Camera.PictureSourceType.CAMERA) {
                        //Delete temp file
                        cleanUp();
                    }
                });
            }
            var defaultOptions = {
                quality: 50,
                saveToPhotoAlbum: false,
                destinationType: Camera.DestinationType.FILE_URI,
                correctOrientation: true,
                showMediaSelector: true,
                sourceType: Camera.PictureSourceType.CAMERA
            };
            var settings = angular.extend(defaultOptions, options);

            if (settings.showMediaSelector) {
                var menus = ['Camera', 'Photo Library'];

                if (settings.showDelete) {
                    menus.push('Delete');
                }
                return this.showActionSheet(undefined, menus, true).then(function (buttonIndex) {
                    switch (buttonIndex) {
                        case 0:
                            return callPlugin(settings);
                        case 1:
                            settings.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
                            return callPlugin(settings);
                        case 2:
                            return self.common.rejectedPromise('delete');
                    }
                    return self.common.rejectedPromise('cancelled');
                });
            }
            return callPlugin(settings);
        },
        //#endregion

        //#region Constructor
        //Constructor
        init: function ($q, $window, config, localization, common) {
            this._super();
            this.q = $q;
            this.window = $window;
            this.config = config;
            this.localization = localization;
            this.common = common;
        }
        //#endregion
    });
    //#region Register
    //Register dialog service
    angular.module('rota.services.plugins', ['rota.services.localization']).factory('Plugins',
    [
        '$q', '$window', 'Config', 'Localization', 'Common',
        function ($q, $window, config, localization, common) {
            var instance = new PluginService($q, $window, config, localization, common);
            return instance;
        }
    ]);
    //#endregion
});