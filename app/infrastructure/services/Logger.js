'use strict';

define(['angular', 'base/BaseService', 'moment'], function (angular, BaseService, moment) {
    //Log Service
    var LogService = BaseService.extend({
        //#region Methods
        //Logger
        info: function (msg, data) {
            this.write('info', msg, data);
        },
        log: function (msg, data) {
            this.write('log', msg, data);
        },
        //Warning
        warn: function (msg, data) {
            this.write('warn', msg, data);
        },
        //Error
        error: function (msg, data) {
            this.write('error', msg, data);
        },
        write: function (kind, msg, data) {
            if (this.config.debugMode) {
                msg = moment().format('h:mm:ss SSS') + '-' + msg;
                if (data)
                    console[kind](msg + ' |', data);
                else
                    console[kind](msg);
            }
        },
        //#endregion

        //#region Init
        //Constructor
        init: function (config, plugins) {
            this._super();
            this.config = config;
            this.plugins = plugins;
        }
        //#endregion
    });
    //#region Register
    //Register
    angular.module('rota.services.logger', ['rota.config']).factory('Logger', ['Config', 'Plugins',
        function (config, plugins) {
            return new LogService(config, plugins);
        }
    ]);
    //#endregion
})