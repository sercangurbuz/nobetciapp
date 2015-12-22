'use strict';

define(['config/App', 'base/BaseCrudController','nobetci/services/data'], function (app, BaseCrudController) {
    //KasaHareketListeController Controller
    var NobetcilerController = BaseCrudController.extend({
        //Module Id
        ModuleId: 'NobetcilerController',

        init: function (bundle, dataApi) {
            this.dataApi = dataApi;
            this._super(bundle);
        },
        getModel: function () {
            return this.dataApi.getList();
        },
        enter: function() {
            return this.refresh();
        },
        extendScope: function () {
            this._super();
        }
        //#endregion
    });
    //Register
    app.addController('nobetcilerController', NobetcilerController, ['dataApi']);
});