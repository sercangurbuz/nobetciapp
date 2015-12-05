'use strict';

define(['base/BaseService', 'angular'], function (BaseService, angular) {
    //Dialog
    var EmailService = BaseService.extend({
        //Mail Gonder
        sendMail: function (subject, body, to, cc, bcc, from) {
            //Mail object
            var msg = {
                From: from || this.currentUser.email,
                Body: body,
                Subject: subject,
                To: to,
                Cc: cc,
                Bcc: bcc,
            };
            //From zorunlu
            if (!this.isAssigned(msg.From)) {
                this.plugins.showToast(this.localization.get('rota.mailfromzorunlu'));
                return this.common.rejectedPromise();
            }
            //From zorunlu
            if (!this.isAssigned(msg.To)) {
                this.plugins.showToast(this.localization.get('rota.mailtozorunlu'));
                return this.common.rejectedPromise();
            }
            //Body zorunlu
            if (!this.isAssigned(msg.Body) || msg.Body === "") {
                this.plugins.showToast(this.localization.get('rota.mailbodyzorunlu'));
                return this.common.rejectedPromise();
            }
            //Mail webap endpoint
            var self = this,
                endpointUrl = this.common.concatAndResolveUrl(this.config.defaultApiUrl, this.config.emailWebApiBackendUrl);
            //Gonder
            return this.$http.post(endpointUrl, msg).catch(function (err) {
                self.plugins.showToast(self.localization.get('rota.mailgonderimindehata'));
                return self.common.rejectedPromise();
            });
        },
        //Constructor
        init: function ($http, $q, localization, plugins, config, currentUser, common) {
            this._super();
            this.$http = $http;
            this.$q = $q;
            this.localization = localization;
            this.config = config;
            this.currentUser = currentUser;
            this.plugins = plugins;
            this.common = common;
        }
    });
    //Register
    angular.module('rota.services.email', []).factory('Email', ['$http', '$q', 'Localization', 'Plugins', 'Config', 'CurrentUser', 'Common',
        function ($http, $q, localization, plugins, config, currentUser, common) {
            var instance = new EmailService($http, $q, localization, plugins, config, currentUser, common);
            return instance;
        }
    ]);
});