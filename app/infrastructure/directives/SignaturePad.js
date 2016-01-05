'use strict';

define(['angular', 'signaturepad', 'jquery'], function (angular, signature, $) {
    angular.module('rota.directives.signature', [])
        .directive('signaturePad', [function () {
            return {
                restrict: 'EA',
                replace: true,
                link: function (scope, element) {
                    var canvas = $('canvas', element)[0];
                    scope.model.signaturePad = new SignaturePad(canvas, {
                        backgroundColor: '#ebebeb'
                    });
                },
                template: '<div class="signature"><canvas></canvas></div>'
            };
        }]);
})