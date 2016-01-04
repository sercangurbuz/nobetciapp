require.config({
    charset: 'windows-1254',
    baseUrl: 'app',
    paths: {
        angular: './infrastructure/core/ionic/js/angular/angular.min',
        angularAnimate: './infrastructure/core/ionic/js/angular/angular-animate.min',
        angularSanitize: './infrastructure/core/ionic/js/angular/angular-sanitize.min',
        uiRouter: './infrastructure/core/ionic/js/angular-ui/angular-ui-router.min',
        ionic: './infrastructure/core/ionic/js/ionic.min',
        angularIonic: './infrastructure/core/ionic/js/ionic-angular.min',
        //NAMED AMD
        'jquery': './infrastructure/core/jquery-1.9.1.min',
        'underscore': './infrastructure/lib/underscore.min',
        'Class': './infrastructure/lib/Class',
        'moment': './infrastructure/lib/moment.min',
        'i18n': './infrastructure/lib/i18n',
        'jrcrop': './infrastructure/lib/jr-crop',
        'jSignature': './infrastructure/lib/jSignature.min',
        'signaturepad': './infrastructure/lib/signature_pad.min',
        //AMD PATHS
        'base': './infrastructure/base',
        'config': './infrastructure/config',
        'services': './infrastructure/services',
        'lib': './infrastructure/lib',
        'directives': './infrastructure/directives',
        'filters': './infrastructure/filters',
        'security': './infrastructure/security',
        'core': './infrastructure/core',
    },
    shim: {
        'angular': { exports: 'angular' },
        'angularAnimate': { exports: 'angularAnimate', deps: ['angular'] },
        'angularSanitize': { exports: 'angularSanitize', deps: ['angular'] },
        'uiRouter': { exports: 'uiRouter', deps: ['angular'] },
        'ionic': { exports: 'ionic' },
        'angularIonic': { exports: 'angularIonic', deps: ['angular', 'ionic', 'uiRouter', 'angularAnimate', 'angularSanitize'] },
        'underscore': { exports: '_' },
        'Class': { exports: 'Class' },
        'jrcrop': { deps: ['angular', 'ionic'] },
        'jSignature': { exports: 'jSignature', deps: ['jquery'] }

    },
    priority: [
        "angular"
    ]
});

//Device Language
var getDeviceLang = function () {
    return (navigator.language || navigator.userLanguage).toLowerCase();
};

require(
    //Dil deðiþtiginde localStorage'a yeni dili atiyoruz ve sayfayi postback'e gonderiyoruz
    //Uygulama bir sonraki acilþta en son acilan dilde aciliyor
    {
        locale: 'tr-tr'
    },
    [
        //Core Modules
        /*"angular","angularAnimate","angularSanitize","uiRouter","ionic","angularIonic"*/
        /*'underscore','Class','moment'*/
        'config/Vendor.Index'
        //App startup module
    ], function () {
        'use strict';

        require(
            //Rota Infrastructure + startup
            ['startup'], function () {

                var start = function () {
                    angular.bootstrap(document, ['rota-mobile-app']);
                };

                (document.body && device) ? start() : ionic.Platform.ready(start);
            });
    });
