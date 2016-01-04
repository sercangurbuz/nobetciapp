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
            return {}; //this.dataApi.getNobetciById(this.params.id);
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
            var self = this,
                scope = this.rootScope.$new(false);

            //Scope methods
            scope.save = function() {
                if (scope.model.signaturePad.isEmpty()) {
                    dialogs.showToast('Lutfen imza atiniz');
                } else {
                    var data = scope.model.signaturePad.toDataURL();
                    return data;
                }
            };

            scope.clear = function() {
                scope.signaturePad.clear();
            };

            scope.model = {};
            //Show modal
            this.modal.showStdPopup(scope, 'Imza Formu', '<signature-pad></signature-pad>', function (e) {
                return scope.save();
            }, true, '�mzala', '�ptal').then(function (data) {
                debugger;
                self.model.imza = data;
            });
        },
        extendScope: function () {
            this.scope.kaydet = this.kaydet.bind(this);
            this.scope.getPhoto = this.getPhoto.bind(this);
            this.scope.sil = this.sil.bind(this);
            this.scope.showSignature = this.showSignature.bind(this);
        }
    });
    //Register
    app.addController('nobetciController', NobetciController, ['dataApi']);
});