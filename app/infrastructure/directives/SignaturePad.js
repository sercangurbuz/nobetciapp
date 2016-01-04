'use strict';

define(['angular', 'signaturepad', 'jquery'], function (angular, signaturepad, $) {
    angular.module('rota.directives.signature', [])
        .directive('signaturePad', ['Dialogs', function (dialogs) {
            return {
                restrict: 'EA',
                replace: true,
                link: function (scope, element, attrs, ngModelCtrl) {
                    var canvas = $('canvas', element)[0];
                    scope.model.signaturePad = new SignaturePad(canvas);

                    //var ratio = Math.max(window.devicePixelRatio || 1, 1);
                    //canvas.width = canvas.offsetWidth * ratio;
                    //canvas.height = canvas.offsetHeight * ratio;
                    //canvas.getContext("2d").scale(ratio, ratio);
                  
                },
                template: '<div class="signature"><canvas></canvas></div>'
            };
        }
        ]);
})