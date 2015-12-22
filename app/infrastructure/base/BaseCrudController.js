'use strict';

define(['base/BaseController', 'angular'], function (BaseController, angular) {
    //Breeze kullanımı olmadan kullanilan Model Controller 
    var BaseCrudController = BaseController.extend({
        //#region Props
        //Kayit işlemi yapıliyor flag
        isSaving: null,
        //Model set ediliyor
        isInitModel: null,
        //Modelde degişklik yapldımı flag
        hasChanges: null,
        //Yeni kayit mi ?
        isNew: null,
        //Model delete ?
        isDeleting: null,
        //#endregion

        //#region Model Generate Methods
        //ViewModel gore veya entityType'e gore yeni instance dondurur
        //(Custom viewmodellerde override edilmeli)
        newModel: function (initData) {
            return this.common.promise();
        },
        //Virtual getModel methodu - Contoller initialize olurken Remote'serverdan
        getModel: function (initData, fromLocal) {
            //Override olmali !
            return this.common.promise();
        },
        //Model initialize işlemini yeniliyoruz - Model Refresh
        //fromLocal : Guncellemeyi localden yapar - Varsayilan remote
        refresh: function (fromLocal, initData) {
            var isLocal = fromLocal === undefined ? true : fromLocal;
            //Modeli tanımla
            return this.defineModel(initData, isLocal);
        },
        //Listeyi yeniler,Sonunda scroll.refreshComplete eventi firlatir
        refreshList: function () {
            var self = this;
            //Refresh
            return this.refresh(false).finally(function () {
                self.scope.$broadcast('scroll.refreshComplete');
            });
        },
        //Modeli guncellemek icin çağrılan method
        //Internal kullanilan method - (setModeli override etmelisin !)
        updateModel: function (data, initData) {
            var self = this,
                modelData = {
                    model: data, initData: initData
                };
            //Modeli set ediyoruz
            return this.common.makePromise(this.setModel(modelData)).then(function (model) {
                //Modeli set et
                if (self.isAssigned(model)) {
                    self.model = model;
                }
            });
        },
        //Model guncellemelerinde çalişan event - Override
        setModel: function (data) {
            //Custom modellerde override edilebilir
            return this.common.promise(data.model);
        },
        //Initialize model
        initModel: function () {
            //Custom modellerde override olmali
            return this.common.promise();
        },
        //Controller yuklenmesi bittikten sonra calişan event
        loaded: function (data) {
            //Override yapılmali
            return this.common.promise();
        },
        //Initialize model
        initialize: function () {
            var self = this;
            //Model initializing başladi
            this.isInitModel = true;
            //newModel ve getModel eventleri caliştirmadan metaData bilgisini yukle
            //Controller startup kısmında cekilecek datayi alan event
            return this.common.makePromise(self.initModel()).then(function (initData) {
                //Modeli olusturuyoruz
                return self.refresh(true, initData).finally(function (data) {
                    //Model sInitializing bitti
                    self.isInitModel = false;
                    //Model set edildekten sonra en son çalişan event
                    self.common.makePromise(self.loaded(data));
                });
            });
        },
        //Model bilgisini initialize ediyoruz 
        //Internal olarak kullaniliyor - (Refresh kullanilmali)
        //fromLocal : Guncellemeyi localden yapar - Varsayilan remote
        defineModel: function (initData, fromLocal) {
            var self = this;
            //isNew parametresine gore getModel veya newModel caliştiriliyor
            return this.common.makePromise(this.isNew ?
                //Yeni modeli al - (Custom viewmodellerde override edilmeli)
                self.newModel(initData) :
                //Eger guncelleme işlemi yapılıyorsa
                //Modelin datasini aliyoruz - (Controller override olmali !)
                self.getModel(initData, fromLocal)).then(function (model) {
                    //Gelen modelin datasini param olarak gonderiyoruz
                    return self.updateModel(model, initData);
                });
        },
        //Modeli silmek icin kullanilan,crud buttondan cagrilan event
        delete: function () {
            var self = this;
            //Deleting
            this.isDeleting = true;
            //DeleteModeli cagir
            this.deleteModel().finally(function () {
                self.isDeleting = false;
            });
        },
        //Modeli silme event
        deleteModel: function (entity) {
            //Override !!
            return this.common.promise();
        },
        //#endregion

        //#region Save Model
        //Save işlemi olmadan once çalişan event
        beforeSave: function () {
            //Override olmali
        },
        //Save işlemi olduktan sonra çalişan event
        afterSave: function () {
            //Override olmali
            return this.common.promise();
        },
        //Internal olarak crudButton'lardan cagrilan before-after eventlerini tetikleyen event
        //options => entities, goon, showMessage, showSpinner
        saveModel: function (options) {
            var self = this,
                defer = this.q.defer(),
                successMessage = this.getLocal('SuccesfullyProcessed');
            //Varsayilan Kaydet başarili mesaji veriyor ve devam etme işlemi aktif değil
            options = angular.extend({ goon: false, showMessage: true }, options);
            //Entity'leri diziye cevir eger varsa
            options.entities = options.entities && this.common.makeArray(options.entities);
            //Kayit işlemi başladi
            this.isSaving = true;
            //Before save event
            this.beforeSave(options.entities || this.model);
            //Validation
            this.validateEntities(options.entities).then(function () {
                //Yetki kontrolu
                return self.checkAuthority().then(function () {
                    //Save işlemi
                    return self.save(options.entities, options.goon, options.showSpinner).then(function (data) {
                        //Success mesaji ver ,Sadece toastr yeterli
                        options.showMessage && self.showSuccess(successMessage);
                        //Yeni kayitmi set,artik yeni kayit degil
                        self.isNew = false;
                        //Başarili kayit işlemi
                        defer.resolve(data);
                        //After save event 
                        return self.common.makePromise(self.afterSave(data)).finally(function () {
                            //afterSave eventinin basarili veya basarizi durumuna bakmiyoruz
                            //save işlemi basarili ise saveModel de basarilidir.
                            //Eger modal ise ve kaydet&devam degilse Kaydet işleminden sonra pencereyi kapatiyoruz
                            !options.goon && self.isModal && self.modalResult(self.model);
                        });
                    }, function (reason) {
                        //Save Failed
                        defer.reject(reason);
                        self.showError(reason.message, reason.title);
                    });
                }, function (reason) {
                    //Yetkisiz işlem
                    defer.reject(reason);
                    self.showError(reason.message, reason.title);
                });
            }, function (reason) {
                //Validation failed
                defer.reject(reason);
                self.showWarning(reason.message, reason.title);
            }).finally(function () {
                //Saving işlemi bitti
                self.isSaving = false;
            });
            //Kayit Sonucu
            return defer.promise;
        },
        //Save
        save: function () {
            //Override !!
            return this.common.promise();
        },
        //Kayit et ve devam et
        savecontinue: function (entities) {
            var self = this;
            //Kaydet
            return this.saveModel({ entities: entities, goon: true }).then(function () {
                //Devam - Yeni kayit ac & Modele bind et
                self.isNew = true;
                self.initialize();
            });
        },
        //#endregion

        //#region Validation
        //Validation
        validateEntities: function () {
            //Model validationlari
            var message,
                defered = this.q.defer();
            //Delete işlemiyse cik
            if (this.isDeleting) {
                defered.resolve();
                return defered.promise;
            }
            //Kullanici tanımlı validationlar
            this.common.makePromise(this.validate()).then(function (errors) {
                //Handle & return errors
                if (errors.length > 0) {
                    //Tum validationlari mesajlarini birleştir
                    errors.forEach(function (err) {
                        message += err.message;
                    });
                    //Promise
                    defered.reject({
                        message: message
                    });
                } else {
                    defered.resolve();
                }
            }, function () {
                defered.reject();
            });
            //Sonuc
            return deferred.promise;
        },
        //Custom validation method
        validate: function (errors) {
            //Override !!
            //Errors geriye dondurmeli
            return this.common.promise(errors);
        },
        //#endregion

        //#region Yetkilendirme
        //Yetki kontrolu
        checkAuthority: function () {
            var authorized,
                deferred = this.q.defer();
            //Yetki kontrolu
            if (this.isDeleting) {
                authorized = this.authority.canDelete;
            } else {
                authorized = this.isNew && this.authority.canInsert ||
                             !this.isNew && this.authority.canUpdate;
            }
            //Eger yetkisiz ise reject et
            if (!authorized) {
                deferred.reject({
                    message: this.getLocal('YetkiHatasiAciklama'),
                    title: this.getLocal('YetkiHatasi'),
                    status: 401
                });
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        },
        //#endregion

        //#region Delete Model
        //Delete Confirmation 
        deleteConfirm: function (entityDisplayName, title, confirm) {
            var deleteTitle = title || this.localization.get('DeleteConfirmTitle'),
                deleteConfirm = confirm || this.localization.get('DeleteConfirm', entityDisplayName);
            //Dialogu cagir
            return this.modal.confirm(deleteTitle, deleteConfirm);
        },
        //#endregion

        //#region Initialize
        //View'a acilacak olan methodlari set ediyoruz
        extendScope: function () {
            this._super();
            //Genel CRUD methodlari 
            this.scope.saveModel = this.saveModel.bind(this);
            this.scope.savecontinue = this.savecontinue.bind(this);
            this.scope.delete = this.delete.bind(this);
            //getModel methodunu caliştirarak modeli update eder 
            this.scope.refresh = this.refresh.bind(this);
            this.scope.refreshList = this.refreshList.bind(this);
        },
        //Property'leri tanımliyoruz
        defineProperties: function () {
            //!! Onemli
            this._super();
            //Yeni kayit
            Object.defineProperty(this.scope, 'isNew', {
                configurable: false,
                get: function () {
                    return self.isNew;
                }
            });
        },
        //Constructor
        init: function (bundle) {
            //BaseController constructor
            this._super(bundle);
            //Yeni kayit mi ? - Convention  : Eger id parametresi New veya Yeni ise yeni kayit modu aktif !
            this.isNew = (this.isModal ? this.modal.modalParams : this.params).id === 'new';
            //Flag varsayilan set
            this.isSaving =
            this.isDeleting =
            this.isInitModel = false;
            this.hasChanges = true;
            //Authentication options
            this.authority = bundle.authority;
            //Form acilişinda model datasini almak icin calişan method (Context tanımlı olmasi gerekir)
            this.initialize();
        }
        //#endregion
    });
    //BaseModelController dondur
    return BaseCrudController;
});