'use strict';

define(['config/App', 'base/BaseCrudController'], function (app, BaseCrudController) {

    var NobetciController = BaseCrudController.extend({
        //Module Id
        ModuleId: 'NobetciController',
        //Contructor
        init: function (bundle) {
            this._super(bundle);
        }

    });
    //Register
    app.addController('nobetciController', NobetciController);
});