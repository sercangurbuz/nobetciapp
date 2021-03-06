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

    var directive = ['$rootScope', '$parse', '$injector', '$q', 'Localization', 'Common', 'Modal', 'CommonUI',
        function ($rootScope, $parse, $injector, $q, localization, common, modal, commonui) {
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
                            //Eger service tan�lanmi�sa ve verilen fn tan�ml� ise
                            if (service && service[fn]) {
                                prom = service[fn].call(service, prm1, prm2);
                            } else {
                                //Eger service tan�mlanmami�sa mevcut controller uzerinde methodu �ali�itiriyoruz
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
                    //Eger value prop tan�ml�anmi�sa valueyu yoksa tum objeyi
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
                    //Get item by key method
                    var getItem = function (key) {
                        //Sonuc promisini dondur veya verilen concrete objyi promise cevir
                        return callMethod(selectMethod, key).then(function (data) {
                            return data;
                        });
                    };
                    //#endregion

                    //#region Listing Methods
                    //Init All Items
                    var initAllItems = function () {
                        var d = $q.defer();
                        //Params de�i�ikliklerini izle,tekrar bind et autosuggest olmayanlarda
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
                    //Set selected item
                    var setSelectedItem = function (item, updateModel) {
                        //Secili objnin value degerini aliyoruz
                        var modelValue = getValueMapper(item);
                        //Viewmodeli update ediyoruz
                        updateModel && ngModelCtrl.$setViewValue(modelValue);
                        //Trigger item select index chaaged
                        callEvent(onSelect, {
                            modelValue: modelValue,
                            item: item,
                            scope: scope
                        });
                        //set display text
                        scope.displayText = item && item[displayProp];
                    };
                    //Show selection list
                    var showList = function (items) {
                        //Create a scope and assign list items
                        var listscope = $rootScope.$new(false);
                        listscope.items = items;
                        listscope.filter = {};

                        listscope.$watch('filter.keywords', function (searchValue, oldValue) {
                            if (searchValue) {
                                if (autoSuggest) {
                                    if (minAutoSuggestCharLen <= searchValue.length) {
                                        callMethod(refreshMethod, searchValue).then(function (data) {
                                            listscope.filteredItems = data;
                                        });
                                    }
                                } else {
                                    //filter items
                                    listscope.filteredItems = _.filter(listscope.items, function (item) {
                                        var displayText = item[displayProp].toLowerCase();
                                        return displayText.indexOf(searchValue) > -1;
                                    });
                                }
                            } else {
                                listscope.filteredItems = listscope.items;
                            }
                        });

                        //list markup
                        var markup = '<ion-modal-view cache-view="false">' +
                                     '  <div class="bar bar-header bar-positive item-input-inset">' +
                                     '      <label class="item-input-wrapper">' +
                                     '          <i class="icon ion-ios-search placeholder-icon"></i>' +
                                     '          <input type="search" placeholder="' + localization.get('rota.ara') + '" ng-model="filter.keywords">' +
                                     '      </label>' +
                                     '      <button class="button button-clear" ng-click="closeModal()" i18n="rota.kapat"></button>' +
                                     '  </div>' +
                                     '  <ion-content class="has-header">' +
                                     '      <ion-list>' +
                                     '          <ion-item class="item-icon-right" ng-click="modalResult(item)" ng-repeat="item in filteredItems">{{item?}}' +
                                     '              <i class="icon ion-checkmark-circled positive"></i>' +
                                     '          </ion-item>' +
                                     '      </ion-list>' +
                                     '  </ion-content>' +
                                     '</ion-modal-view>';
                        //replace
                        markup = markup.replace('?', displayPropSufix);
                        //Show modal
                        return modal.showModal(markup, { scope: listscope }).then(function (selectedItem) {
                            //set selected item
                            setSelectedItem(selectedItem, true);
                        });
                    }
                    //Init List
                    scope.initList = function () {
                        //get data
                        var p = autoSuggest ? common.promise() : initAllItems();
                        //show list after data is fetched
                        return p.then(function (data) {
                            return showList(data || []);
                        });
                    }
                    //Clear model
                    scope.clearModel = function () {
                        ngModelCtrl.$setViewValue(undefined);
                    }
                    //#endregion

                    //#region Init
                    //Watch ngModel
                    scope.$watch(attrs.ngModel, function (modelValue) {
                        if (!modelValue) {
                            setSelectedItem();
                            commonui.showToast(localization.get('rota.secimkaldirildi'));
                        }
                        getItem(modelValue).then(function (item) {
                            setSelectedItem(item);
                        });
                    });
                    //Watch ngDisabled
                    scope.$watch(attrs.ngDisabled, function (newValue) {
                        scope.isDisabled = newValue;
                    });
                    //#endregion
                },
                template: function (elem, attrs) {
                    return '<label class="rt-select item item-input item-select" on-tap="isDisabled || initList()" on-hold="isDisabled || clearModel()">' +
                           '  <div class="input-label">{{displayText}}' +
                           '     <span ng-hide="displayText" class="placeholder">' +
                           localization.get(attrs.phI18n || 'rota.seciniz') +
                           '</span>' +
                           '  </div>' +
                           '</label>';
                }
            }
        }
    ];

    //#region Register

    //#endregion
    angular.module('rota.directives.rtselect', [])
        .directive('rtSelect', directive);
})