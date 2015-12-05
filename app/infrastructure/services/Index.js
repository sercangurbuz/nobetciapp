define(['angular', 'services/Common', 'services/CommonUI', 'services/Caching', 'services/Routing',
    'services/Dialogs', 'services/Modal', 'services/Plugins', 'services/Security',
    'services/Logger', 'services/Interceptors', 'services/Events', 'services/Email',
    'services/ExceptionHandler'], function (angular) {
        //Serviceler icin index dosyasi
        angular.module('rota.services',
        [
            'rota.services.exceptionhandler',
            'rota.services.common',
            'rota.services.commonui',
            'rota.services.caching',
            'rota.services.events',
            'rota.services.security',
            'rota.services.httpRequestTracker',
            'rota.services.routing',
            'rota.services.localization',
            'rota.services.dialogs',
            'rota.services.plugins',
            'rota.services.modal',
            'rota.services.logger',
            'rota.services.email'
        ]);
    })
