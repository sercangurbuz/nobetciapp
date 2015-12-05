'use strict';

define(['angular', 'services/Localization'], function (angular) {
    angular.module('rota.directives.ionSearch', ['rota.services.localization'])
        .directive('ionSearch', ['Localization', function (localization) {
                return {
                    restrict: 'E',
                    replace: true,
                    scope: {
                        getData: '&source',
                        model: '=?',
                        search: '=?filter'
                    },
                    link: function (scope, element, attrs) {
                        attrs.minLength = attrs.minLength || 0;
                        scope.placeholder = attrs.placeholder || localization.get('Arama');
                        scope.search = { value: '' };

                        if (attrs.class)
                            element.addClass(attrs.class);

                        if (attrs.source) {
                            scope.$watch('search.value', function (newValue, oldValue) {
                                if (newValue.length > attrs.minLength) {
                                    scope.getData({ str: newValue }).then(function (results) {
                                        scope.model = results;
                                    });
                                } else {
                                    scope.model = [];
                                }
                            });
                        }

                        scope.clearSearch = function () {
                            scope.search.value = '';
                        };
                    },
                    template: '<div class="item-input-wrapper">' +
                        '<i class="icon ion-android-search"></i>' +
                        '<input type="search" autocorrect="off" placeholder="{{placeholder}}" ng-model="search.value">' +
                        '<i ng-if="search.value.length > 0" ng-click="clearSearch()" class="icon ion-close"></i>' +
                        '</div>'
                };
            }
        ]);

})