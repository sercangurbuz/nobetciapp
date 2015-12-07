'use strict';

define(['config/App', 'base/BaseCrudController'], function (app, BaseCrudController) {
    //KasaHareketListeController Controller
    var NobetcilerController = BaseCrudController.extend({
        //Module Id
        ModuleId: 'NobetcilerController'
        //#endregion
    });
    //Register
    app.addController('nobetcilerController', NobetcilerController);
});