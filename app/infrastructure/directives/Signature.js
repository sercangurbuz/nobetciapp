'use strict';

define(['angular', 'jSignature','jquery'], function (angular, jSignature,$) {
    angular.module('rota.directives.signature', [])
        .directive('signature', [function () {
            return {
                restrict: 'EA',
                replace:true,
                //require: 'ngModel',
                link: function (scope, element, attrs, ngModelCtrl) {
                    $(element).jSignature();
                }
            };
        }
        ]);
})