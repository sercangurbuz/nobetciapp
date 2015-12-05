define(['angular', 'directives/LocalizationFilter', 'directives/IonSearch', 'directives/IonDatepicker'], function (angular) {
    //Serviceler icin index dosyasi
    angular.module('rota.directives',
    [
        'rota.directives.localization',
        'rota.directives.ionSearch',
        'rota.directives.ionDatepicker'
    ]);
})
