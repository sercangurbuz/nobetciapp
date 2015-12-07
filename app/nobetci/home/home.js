'use strict';

define(['config/App', 'base/BaseController'], function (app, BaseController) {
    //ArkasAkilliRehber Controller
    var HomeController = BaseController.extend({
        //Module Id
        ModuleId: 'HomeController',
        //#region Events
        init: function (bundle) {
            this._super(bundle);
        },
        exception: function (fn, ex) {
            //TODO:Zaten acilmi� ve arka arkaya hata gelmi� olabilir.
            var templ = "<p>" + this.getLocal('rota.hataozur') + "</p>" +
                "<p><b>" + this.getLocal("rota.hataaciklama") + "</b></p>" + ex.message;

            var p = this.showPopup(this.getLocal('rota.hataolustu'), templ,
                null, this.getLocal("rota.yenidenbaslat"), true, this.getLocal("rota.kapat"), 'error');

            p.then(function () {
                //Yeniden ba�lat
                location.reload();
            }, function () {
                //��k��
                ionic.Platform.exitApp();
            });
        }
        //#endregion
    });
    //Register
    app.addController('HomeController', HomeController);
});
