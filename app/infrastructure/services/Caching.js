'use strict';

define(['angular', 'base/BaseService'], function (angular, BaseService) {
    //Providerlari oluşturan sinif
    var CacheService = BaseService.extend({
        //Module Id
        moduleId: 'Caching Service',
        //PP
        $window: null,
        //Save cache
        saveToCache: function (cacheKey, data) {
            data = JSON.stringify(data);
            this.$window.localStorage.setItem(cacheKey, data);
            this.logger.log('Cache updated [' + cacheKey + ']');
        },
        //Save session
        saveToSession: function (cacheKey, data) {
            data = JSON.stringify(data);
            this.$window.sessionStorage.setItem(cacheKey, data);
            this.logger.log('Session updated [' + cacheKey + ']');
        },
        //Cache'i sil
        removeCache: function (cacheKey) {
            this.$window.localStorage.removeItem(cacheKey);
            this.logger.log('Cache removed [' + cacheKey + ']');
        },
        //Restore from cache
        restoreFromCache: function (cacheKey) {
            var data = this.$window.localStorage.getItem(cacheKey);
            if (this.common.isAssigned(data)) {
                data = JSON.parse(data);
                this.logger.log('Cache restored [' + cacheKey + ']', data);
                return data;
            }
            return null;
        },
        //Restore from session
        restoreFromSession: function (cacheKey) {
            var data = this.$window.sessionStorage.getItem(cacheKey);
            if (this.common.isAssigned(data)) {
                data = JSON.parse(data);
                this.logger.log('Session restored [' + cacheKey + ']', data);
                return data;
            }
            return null;
        },
        //Constructor
        init: function ($window, logger, common) {
            //Call Base contructor
            this._super(logger);
            //Params
            this.$window = $window;
            this.common = common;
        }
    });
    //Register cache service
    angular.module('rota.services.caching', []).factory('Caching', ['$window', 'Logger', 'Common', function ($window, logger, common) {
        var instance = new CacheService($window, logger, common);
        return instance;
    }
    ]);
});
