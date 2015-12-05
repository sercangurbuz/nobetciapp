'use strict';

define(['angular', 'moment', 'services/Localization'], function (angular, moment) {
    angular.module('rota.directives.ionDatepicker', ['rota.services.localization'])
        .directive('ionDatepicker', ['$filter', '$parse', 'Localization', function ($filter, $parse, localization) {
            return {
                restrict: 'EA',
                replace: true,
                scope: true,
                require: 'ngModel',
                link: function (scope, element, attrs, ngModelCtrl) {
                    //Title
                    scope.inputlabel = attrs.title || localization.get('Tarih');
                    scope.format = attrs.format || 'dd/MM/yyyy';
                    //Bugunu set et
                    if (attrs.setToday != undefined) {
                        scope.selDate = new Date();
                        ngModelCtrl.$setViewValue(scope.selDate);
                    }
                    //Ayýn ilk gunu
                    if (attrs.setStartOfMonth != undefined) {
                        var startOfMonth = moment().startOf('month').startOf('day').toDate();
                        ngModelCtrl.$setViewValue(startOfMonth);
                    }
                    //Ayýn son gunu
                    if (attrs.setEndOfMonth != undefined) {
                        var endOfMonth = moment().endOf('month').endOf('day').toDate();
                        ngModelCtrl.$setViewValue(endOfMonth);
                    }
                    //Deep watch model
                    scope.$watch(attrs.ngModel, function (newV, oldV) {
                        scope.selDate = newV;
                    }, true);
                    //Open dialog
                    scope.openDatePicker = function () {
                        var options = {
                            date: scope.selDate || new Date(),
                            mode: 'date'
                        };

                        datePicker.show(options, function (date) {
                            ngModelCtrl.$setViewValue(date);
                            scope.selDate = date;
                            scope.$apply();
                        });
                    };
                },
                template: '<label class="item item-input" ng-click="openDatePicker()">' +
                    '<span class="input-label">{{inputlabel}}</span>' +
                    '<span id="sonuc" class="positive">{{selDate | date :format}}</span>' +
                    '</label>'
            };
        }
        ]);
})