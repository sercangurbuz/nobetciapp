'use strict';

define(['angular'], function (angular) {

    angular.module('rota.filters.money', []).filter('money', function () {
        return function (input, symbol) {
            var formattedValue = input.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + (symbol && (' ' + symbol));
            return formattedValue;
        };
    });
});