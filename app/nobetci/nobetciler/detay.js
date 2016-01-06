'use strict';

define(['config/App', 'base/BaseCrudController', 'nobetci/services/data','underscore'], function (app, BaseCrudController,_) {

    var DEFAULT_AVATAR = 'img/avatar.jpg';
    var NobetciController = BaseCrudController.extend({
        //Module Id
        ModuleId: 'NobetciController',
        //Contructor
        init: function (bundle, dataApi, $templateCache) {
            this.dataApi = dataApi;
            this.$templateCache = $templateCache;
            this._super(bundle);
        },
        newModel: function () {
            return {
                icon: DEFAULT_AVATAR
            };
        },
        getModel: function () {
            return {};//return this.dataApi.getNobetciById(this.params.id);
        },
        setModel: function (data) {
            data.model.icon = data.model.icon || DEFAULT_AVATAR;
            data.model.selectedId = 1;
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
            var self = this;
            return this.dataApi.deletebyid(id).then(function () {
                self.go("home.nobetciler");
            });
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
        showSignature: function () {
            var self = this;
            this.dialogs.showSignatureForm().then(function (data) {
                self.model.imza = data;
            });
        },

        showList: function (p) {
            return this.scope.listdata;
        },

        fetchItem: function (key) {
            return this.find(this.scope.listdata, { id: key });
        },
        extendScope: function () {
            this.scope.kaydet = this.kaydet.bind(this);
            this.scope.getPhoto = this.getPhoto.bind(this);
            this.scope.sil = this.sil.bind(this);
            this.scope.showSignature = this.showSignature.bind(this);
            this.scope.listdata = [{ id: 1, adi: "sercan", soyad: "gurbuz" }, { id: 2, adi: "mehmet", soyad: "ali" },
                { id: 3, adi: "hakan", soyad: "makan" }];
            this.scope.showList = this.showList.bind(this);
            this.scope.fetchItem = this.fetchItem.bind(this);

        }
    });
    //Register
    app.addController('nobetciController', NobetciController, ['dataApi', '$templateCache']);
});