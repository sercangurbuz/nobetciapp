'use strict';
//http://dev-blog.cloud-spinners.com/2014/02/angular-js-localization-with-require-js.html
define(['base/BaseService', 'i18n!resources/nls/resources', 'angular'],
    function (BaseService, localeValues, angular) {
        //Localization işlemlerinin yapıldıdı sınıf
        var LocalizationService = BaseService.extend({
            //DI members
            $window: null,
            $interpolate: null,
            resource: null,
            //Properties
            defineProperties: function () {
                //RequireJs'den aktif dili alir.
                Object.defineProperty(this, 'language', {
                    //requirejs.s.contexts._.config.locale
                    value: this.$window.localStorage.getItem('activeLanguage') || 'tr-tr'
                });
            },
            //Aktif dili değiştir
            setLanguage: function (value) {
                //Aktif dili persistent localStorage'e atiyoruz
                this.$window.localStorage.setItem('activeLanguage', value);
                //Full postback ile yeni dildeki resource yukle (bkz:config/main.js)
                this.$window.location.reload();
            },
            /*
            Verilen key bilgisine gore localized degeri dondurur
            Ornek:
            //Simple localization
            get('booking.musteri');
            //With Formating
            get('booking.blokajHatasi',musteriAdi); booking.blokajHatasi = {0} musteri blokajkidir !
            //With Interpolation
            get('booking.blokajHatasi',{musteriAdi:'Dummy'}); booking.blokajHatasi = {{musteriAdi}} musteri blokajkidir !*/
            get: function () {
                //Parametreleri diziye cevir
                var params = Array.prototype.slice.apply(arguments);
                //undefined bir seyi cevirmek istiyorsa cik !
                if (params[0] === undefined) {
                    return null;
                }
                //ilk param key
                var tag = this.getLocalizedValue(params[0]);
                //Eger birden fazla parametre varsa formatliyoruz
                if ((tag !== null) && (tag !== undefined) && (tag !== '')) {
                    if (params.length > 1) {
                        //Eger 2.parametre object geliyorsa interpolation yap
                        if (angular.isObject(params[1])) {
                            tag = $interpolate(tag)(params[1]);
                        } else {
                            //Eger object'ten farkli bir degerse normal format'lama yapıyoruz
                            for (var index = 1; index < params.length; index++) {
                                var target = '{' + (index - 1) + '}';
                                tag = tag.replace(target, params[index]);
                            }
                        }
                    }
                };
                //Sonuc
                return tag;
            },
            //Verilen path degerini parse ederek keyin karşiligini bulur
            getLocalizedValue: function (path) {
                var keys = path.split('.');
                return this.getValue(keys);
            },
            //Verilen key degerine gore localized karsiligini bulur
            getValue: function (keys) {
                var self = this,
                    level = 0;

                function get(context) {
                    if (context[keys[level]]) {
                        var val = context[keys[level]];

                        if (typeof val === 'string') {
                            return val;
                        } else {
                            level++;
                            return get(val);
                        }
                    } else {
                        //self.logger.error('Missing localized string for: ', keys);
                        return null;
                    }
                }
                return get(this.resource);
            },
            //Constructor
            init: function ($window, $interpolate, resource) {
                //Base constructor
                this._super();
                //window servisi
                this.$window = $window;
                this.$interpolate = $interpolate;
                //Dil cevrimlerini aliyoruz
                this.resource = resource;
                //Property'leri tanımla
                this.defineProperties();
            },
        });
        //Register resources
        angular.module('rota.services.localization', []).factory('Resource', ['$window', 'Common',
        function ($window, common) {
            var currentLang = $window.localStorage.getItem('activeLanguage') || 'tr-tr';
            //Fix turkce karakter sorunu
            //https://github.com/jrburke/requirejs/pull/170
            var utf8Towindows1254 = function (utf8Values) {
                var result = {};

                for (var resKey in utf8Values) {
                    var resValue = utf8Values[resKey];

                    if (angular.isObject(resValue))
                        result[resKey] = utf8Towindows1254(resValue);
                    else {
                        for (var i = 0; i < $window.utf8toturkish.length; i++) {
                            var conversion = $window.utf8toturkish[i];

                            for (var utfKey in conversion) {
                                var utf8Eq = conversion[utfKey].toString();
                                resValue = common.replaceAll(resValue, utf8Eq, utfKey);
                            }
                        }
                        result[resKey] = resValue;
                    }
                }
                return result;
            };
            //Requirejs in i18n'e gore 
            return currentLang === "tr-tr" ? utf8Towindows1254(localeValues) : localeValues;
        }
        ])
        //Register service
        .factory('Localization', [
            '$window', '$interpolate', 'Resource',
            function ($window, $interpolate, resource) {
                var instance = new LocalizationService($window, $interpolate, resource);
                return instance;
            }
        ]);
    });
