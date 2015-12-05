'use strict';

define(['Class'], function (Class) {
    //Base Service
    var BaseApi = Class.extend({
        //Module Id
        moduleId: '[undefined api]',
        //Get verb with caching capability
        get: function (url, fromCache, sessionStorogeKey, params) {
            var self = this,
                absolutePath = this.getAbsoluteUrl(url);
            //Eger sessionStorogeKey tanýmli ise session'dan aliyoruz
            var cachedData = fromCache && sessionStorogeKey && this.caching.restoreFromSession(sessionStorogeKey);
            //Cachenmiþ data varsa oncelikle onu yoksa remoteDan datayi cekiyoruz
            var result = cachedData || this.http.get(absolutePath, params).then(function (data) {
                //Session'i guncelle
                sessionStorogeKey && self.caching.saveToSession(sessionStorogeKey, data.data);
                return data.data;
            });
            //Sonuc her zaman promise
            return this.common.makePromise(result);
        },
        //Path'i ayarlar
        getAbsoluteUrl: function (url) {
            var apiRelativeUrl = this.common.concatAndResolveUrl(this.backEndUrl || this.config.defaultApiUrl, this.relativePathUrl);
            return this.common.concatAndResolveUrl(apiRelativeUrl, url);
        },
        //Post verb
        post: function (url, params) {
            var absolutePath = this.getAbsoluteUrl(url);
            return this.http.post(absolutePath, params);
        },
        //Init Bundle
        initBundle: function (bundle) {
            this.q = bundle.$q;
            this.http = bundle.$http;
            this.common = bundle.common;
            this.caching = bundle.caching;
            this.routing = bundle.routing;
            this.logger = bundle.logger;
            this.config = bundle.config;
        },
        //Controller constructor
        init: function (bundle, relativePathUrl, backEndUrl) {
            //Init Bundle
            this.initBundle(bundle);
            this.backEndUrl = backEndUrl;
            this.relativePathUrl = relativePathUrl;
        }
    });
    //BaseApi döndür
    return BaseApi;
});