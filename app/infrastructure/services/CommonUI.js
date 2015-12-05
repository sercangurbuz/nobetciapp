'use strict';

define(['angular'], function (angular) {
    //Common helpers
    angular.module('rota.services.commonui', [])
        .factory('CommonUI', ['Common', 'Dialogs', 'Plugins', function (common, dialogs, plugins) {
            //Ortak kullanilan Methodlar
            return {
                showAlert: function (message, title, buttonName) {
                    return common.isSimulator() ? dialogs.showAlert(message, title, buttonName) :
                        plugins.showAlert(message, title, buttonName);
                },
                //Show alert
                showConfirm: function (message, title, okButtonText, cancelButtonText) {
                    return common.isSimulator() ? dialogs.showConfirm(message, title, okButtonText, cancelButtonText) :
                        plugins.showConfirm(message, title, okButtonText, cancelButtonText);
                },
                //Show alert
                showPrompt: function (message, title, defaultText) {
                    return common.isSimulator() ? dialogs.showPrompt(message, title, defaultText) :
                        plugins.showPrompt(message, title, defaultText);
                },
                //Show Actionsheet
                showActionSheet: function (title, buttonLabels, showCancelButton, destructiveButtonText) {
                    return common.isSimulator() ? dialogs.showActionSheet(title, buttonLabels, showCancelButton, destructiveButtonText) :
                        plugins.showActionSheet(title, buttonLabels, showCancelButton, destructiveButtonText);
                },
                //Show Toast
                showToast: function (message) {
                    return common.isSimulator() ? dialogs.showToast(message) : plugins.showToast(message);
                }
            };
        }
        ]);
});