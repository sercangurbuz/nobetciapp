'use strict';

define(['angular', 'underscore'], function (angular, _) {

    //#region Consts
    //DataSource olrak Obj set edilirse varsayilan value prop
    var OBJ_VALUE_PROP_NAME = 'key',
        //DataSource olrak Obj set edilirse varsayilan display prop
        OBJ_DISPLAY_PROP_NAME = 'value';
    //Filter Type
    var FILTER_TYPE = {
        'STARTS_WITH': 'startsWith',
        'CONTAINS': 'contains'
    };
    //#endregion

    var directive = ['$rootScope', '$parse', '$injector', '$q', 'Localization', 'Common', 'Modal',
        function ($rootScope, $parse, $injector, $q, localization, common, modal) {
            return {
                restrict: 'EA',
                require: 'ngModel',
                scope: true,
                link: function (scope, element, attrs, ngModelCtrl) {
                    //#region Init vars
                    var selectPromise = $q.when(null);
                    //Extract props & fns
                    var minAutoSuggestCharLen = attrs.minAutoSuggestCharLen || 3,
                        autoSuggest = angular.isDefined(attrs.refresh),
                        service = attrs.service && $injector.get(attrs.service),
                        refreshMethod = attrs.refresh,
                        selectMethod = attrs.select,
                        itemsMethod = attrs.items,
                        params = $parse(attrs.params),
                        onSelect = $parse(attrs.onSelect),
                        valuePropGetter = attrs.valueProp && $parse(attrs.valueProp),
                        setterPromise = attrs.promise && $parse(attrs.promise),
                        setterData = attrs.data && $parse(attrs.data),
                        setterSelectedModel = attrs.selectedModel && $parse(attrs.selectedModel),
                        newItemOptions = attrs.newItemOptions && $parse(attrs.newItemOptions)(scope),
                        searchOptions = attrs.searchOptions && $parse(attrs.searchOptions)(scope),
                        bindModel = angular.isDefined(attrs.bindModel),
                        displayProp = (attrs.displayProp ? attrs.displayProp : OBJ_DISPLAY_PROP_NAME),
                        displayPropSufix = '.' + displayProp;
                    //#endregion

                    //#region Methods
                    //Verilen obj nesnesini key-value diziye cevirir
                    var objToArray = function (obj) {
                        var result = [];
                        for (var prop in obj) {
                            var item = {};
                            item[OBJ_VALUE_PROP_NAME] = obj[prop];
                            item[OBJ_DISPLAY_PROP_NAME] = prop;
                            //Ekle
                            result.push(item);
                        }
                        return result;
                    };
                    //Call Method
                    var callMethod = function (fn, p1) {
                        var prom,
                            argsP = common.makePromise(params(scope)),
                            d = $q.defer();
                        //Model bind edilcekse
                        var filters = bindModel ? [argsP, scope.modelPromise] : [argsP];
                        //Params'i promise durumuna getir
                        $q.all(filters).then(function (args) {
                            //Get methodu icin parametreleri ayarla
                            var filterParam = bindModel ? args : args[0];
                            var prm1 = p1 || filterParam,
                                prm2 = p1 && filterParam;
                            //Eger service tanýlanmiþsa ve verilen fn tanýmlý ise
                            if (service && service[fn]) {
                                prom = service[fn].call(service, prm1, prm2);
                            } else {
                                //Eger service tanýmlanmamiþsa mevcut controller uzerinde methodu çaliþitiriyoruz
                                var selfn = $parse(fn)(scope);
                                if (selfn) {
                                    prom = angular.isFunction(selfn) ? selfn(prm1, prm2) : selfn;
                                } else {
                                    //Eger array ise reject dondur notInitiated kodu ile
                                    d.reject({ code: "notInitiated", msg: "rtSelect --> items prop is falsy" });
                                    return d.promise;
                                }
                            }
                            //Sonuc promisini dondur veya verilen concrete objyi promise cevir
                            common.makePromise(prom).then(function (data) {
                                d.resolve(data);
                            }, function (err) {
                                d.reject({ code: "error", msg: "rtSelect --> Error occured when getting items " + err.exception });
                            });
                        });
                        //Sonuc promise
                        return d.promise;
                    }
                    //Trigger event
                    var callEvent = function () {
                        var m = arguments[0],
                            result = true;

                        if (m && angular.noop !== m) {
                            var fn = m(scope);
                            result = fn && fn(arguments[1], arguments[2],
                                              arguments[3]);
                        }
                        return result;
                    };
                    //Set Model 
                    var setModel = function (value, modelValue) {
                        scope.selected.model = value;
                        //
                        if (setterSelectedModel && angular.noop != setterSelectedModel) {
                            setterSelectedModel.assign(scope, value);
                        }
                        //scope.tooltip = value && (modelValue + '-' + value[attrs.displayProp]);
                    };
                    //Eger value prop tanýmlþanmiþsa valueyu yoksa tum objeyi
                    var getValueMapper = function (itemObject) {
                        return valuePropGetter ? valuePropGetter(itemObject) : itemObject;
                    };
                    //Init get all methods
                    var callGetAllItems = function (allItems) {
                        var d = $q.defer();
                        //Init data
                        callMethod(allItems).then(function (data) {
                            //Check if result is object,converto to array with key,value pair
                            if (angular.isObject(data) && !angular.isArray(data)) {
                                data = objToArray(data);
                                valuePropGetter = $parse(OBJ_VALUE_PROP_NAME);
                            }
                            d.resolve(data);
                        },
                            function (err) {
                                //Eger scope uzerinde obje gonderiliyorsa
                                if (err.code === "notInitiated") {
                                    scope.$watchCollection(allItems, function (data) {
                                        if (data) {
                                            return d.resolve(data);
                                        }
                                    });
                                } else {
                                    //Eger diger hatalar geliyorsa hatayi gonder
                                    d.reject(err);
                                }
                            }
                        );
                        return d.promise;
                    };
                    //AutoSuggest get item by key method
                    var getAutoSuggestItem = function (key) {
                        //Sonuc promisini dondur veya verilen concrete objyi promise cevir
                        return callMethod(selectMethod, key).then(function (data) {
                            return data;
                        });
                    };
                    //#endregion

                    //#region Listing Methods
                    //Init AutoSuggest
                    var initAutoSuggest = function () {
                        //AutoSuggest get list function
                        scope.refreshFn = function (keyword) {
                            if (keyword && minAutoSuggestCharLen <= keyword.length) {
                                //Sonuc promisini dondur veya verilen concrete objyi promise cevir
                                return callMethod(refreshMethod, keyword).then(function (data) {
                                    return data;
                                });
                            }
                        };
                    };
                    //Init All Items
                    var initAllItems = function () {
                        var d = $q.defer();
                        //Params deðiþikliklerini izle,tekrar bind et autosuggest olmayanlarda
                        if (angular.isDefined(attrs.params)) {
                            scope.$watch(attrs.params, function (newParams, oldParams) {
                                //if (newParams && !_.isEqual(newParams, oldParams)) {
                                if (newParams) {
                                    callGetAllItems(itemsMethod).then(function (data) {
                                        d.resolve(data);
                                    });
                                }
                            }, true);
                        } else {
                            callGetAllItems(itemsMethod).then(function (data) {
                                d.resolve(data);
                            });
                        }
                        return d.promise;
                    };
                    //
                    var setSelectedItem = function (item) {
                        //Secili objnin value degerini aliyoruz
                        var modelValue = getValueMapper(item);
                        //Viewmodeli update ediyoruz
                        ngModelCtrl.$setViewValue(modelValue);
                        //Trigger item select index chaaged
                        callEvent(onSelect, {
                            modelValue: modelValue,
                            item: item,
                            scope: scope
                        });
                        //set display text
                        scope.displayText = item[displayProp];
                    };
                    //Show selection list
                    var showList = function (items) {
                        //Create a scope and assign list items
                        var listscope = $rootScope.$new(false);
                        listscope.items = items;
                        listscope.filter = {};

                        listscope.$watch('filter.keywords', function (searchValue, oldValue) {
                            if (searchValue) {
                                listscope.filteredItems = _.filter(listscope.items, function (item) {
                                    var displayText = item[displayProp].toLowerCase();
                                    return displayText.indexOf(searchValue) > -1;
                                });
                            } else {
                                listscope.filteredItems = listscope.items;
                            }
                        });

                        //list markup
                        var markup = '<ion-modal-view cache-view="false">' +
                                     '  <div class="bar bar-header item-input-inset">' +
                                     '      <label class="item-input-wrapper textbox-search">' +
                                     '          <i class="icon ion-ios7-search placeholder-icon"></i>' +
                                     '          <input type="search" placeholder="Ara..." ng-model="filter.keywords">' +
                                     '      </label>' +
                                     '  </div>' +
                                     '  <ion-content class="has-header">' +
                                     '      <ion-list>' +
                                     '          <ion-item ng-click="modalResult(item)" ng-repeat="item in filteredItems">{{item?}}</ion-item>' +
                                     '      </ion-list>' +
                                     '  </ion-content>' +
                                     '</ion-modal-view>';
                        //replace
                        markup = markup.replace('?', displayPropSufix);
                        //Show modal
                        return modal.showModal(markup, { scope: listscope }).then(function (selectedItem) {
                            //set selected item
                            setSelectedItem(selectedItem);
                        });
                    }
                    //Init List
                    scope.initList = function () {
                        //get data
                        var p = initAllItems();
                        //show list after data is fetched
                        return p.then(function (data) {
                            return showList(data);
                        });
                    }
                    //#endregion
                },
                template: '<label class="rt-select item item-input item-select" ng-click="initList()">' +
                          '  <div class="input-label">{{displayText}}' +
                          '     <span ng-hide="displayText" class="placeholder">Seçiniz...</span>' +
                          '  </div>' +
                          '</label>'
            }
        }
    ];

    //#region Register

    //#endregion
    angular.module('rota.directives.rtselect', [])
        .directive('rtSelect', directive);
})