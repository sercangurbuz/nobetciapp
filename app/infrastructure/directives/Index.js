define(['angular', 'directives/LocalizationFilter', 'directives/IonSearch',
        'directives/IonDatepicker', 'directives/SignaturePad', 'directives/rtSelect'], function (angular) {
    //Serviceler icin index dosyasi
    angular.module('rota.directives',
    [
        'rota.directives.localization',
        'rota.directives.ionSearch',
        'rota.directives.ionDatepicker',
        'rota.directives.signature',
        'rota.directives.rtselect'
    ]);
})
