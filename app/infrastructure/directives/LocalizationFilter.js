'use strict';

define(['angular', 'services/Localization'], function (angular) {
    //Localization zimbirtilari
    angular.module('rota.directives.localization', ['rota.services.localization'])
    // simple translation filter
    // usage {{ TOKEN | i18n }}
    .directive('i18n', ['Localization', function (localization) {
        return {
            restrict: "A",
            link: function (scope, elm, attrs) {
                elm.text(localization.get(attrs.i18n) || 'Resource (' + attrs.i18n + ')');
            }
        };
    }])
        .directive('i18nPlaceholder', ['Localization', function (localization) {
            return {
                restrict: "A",
                link: function (scope, elm, attrs) {
                    elm.attr('placeholder', localization.get(attrs.i18nPlaceholder) || 'Resource (' + attrs.i18nPlaceholder + ')');
                }
            };
        }])
    // usage <span data-i18n="TOKEN" ></span>
    .filter('i18n', ['Localization', function (localization) {
        return function (input) {
            return localization.get(input) || 'Resource (' + input + ')';
        };
    }]);
});