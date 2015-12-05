define(['angular', 'config/Config', 'services/Index', 'directives/Index', 'base/Index', 'filters/Index'], function (angular) {
    //Rota module index
    angular.module('rota',
    [
        'rota.services',
        'rota.config',
        'rota.directives',
        'rota.filters'
    ]);
});