'use strict';

define(['config/App', 'base/BaseCrudController', 'nobetci/services/data'], function (app, BaseCrudController) {

    var DEFAULT_AVATAR = 'img/avatar.jpg';
    var NobetciController = BaseCrudController.extend({
        //Module Id
        ModuleId: 'NobetciController',
        //Contructor
        init: function (bundle, dataApi, $jrCrop) {
            this.dataApi = dataApi;
            this.$jrCrop = $jrCrop;
            this._super(bundle);
        },
        newModel: function () {
            return {
                icon: DEFAULT_AVATAR
            };
        },
        getModel: function () {
            return this.dataApi.getNobetciById(this.params.id);
        },
        setModel: function (data) {
            data.model.icon = data.model.icon || DEFAULT_AVATAR;
            return data.model;
        },
        kaydet: function () {
            var self = this;
            var p = this.isNew ? this.dataApi.add(this.model) : this.dataApi.update(this.model);

            p.then(function () {
                self.go("home.nobetciler");
            }, function (err) {
                console.log(err.message);
            });
        },
        sil: function (id) {
            return this.dataApi.deleteById(id);
        },
        getPhoto: function () {
            var self = this;
            this.plugins.getPicture({
                width: 300,
                height: 300,
                showDelete: this.scope.model.icon !== DEFAULT_AVATAR
            }).then(function (imageUrl) {
                self.dialogs.cropPicture({
                    imageUrl: imageUrl
                }).then(function (imageData) {
                    self.scope.model.icon = imageData;
                });
            }, function (error) {
                if (error === 'delete') {
                    self.scope.model.icon = DEFAULT_AVATAR;
                }
            });
        },
        extendScope: function () {
            this.scope.kaydet = this.kaydet.bind(this);
            this.scope.getPhoto = this.getPhoto.bind(this);
            this.scope.sil = this.sil.bind(this);
        }
    });
    //Register
    app.addController('nobetciController', NobetciController, ['dataApi']);
});