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
            //TODO:Zaten acilmiþ ve arka arkaya hata gelmiþ olabilir.
            var templ = "<p>" + this.getLocal('rota.hataozur') + "</p>" +
                "<p><b>" + this.getLocal("rota.hataaciklama") + "</b></p>" + ex.message;

            var p = this.showPopup(this.getLocal('rota.hataolustu'), templ,
                null, this.getLocal("rota.yenidenbaslat"), true, this.getLocal("rota.kapat"), 'error');

            p.then(function () {
                //Yeniden baþlat
                location.reload();
            }, function () {
                //Çýkýþ
                ionic.Platform.exitApp();
            });
        }
        //#endregion
    });
    //Register
    app.addController('HomeController', HomeController);
});
