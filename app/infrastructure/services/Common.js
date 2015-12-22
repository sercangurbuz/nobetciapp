'use strict';

define(['angular'], function (angular) {
    //Common helpers
    angular.module('rota.services.common', [])
        .factory('Common', ['$q', function ($q) {
            //Ortak kullanilan Methodlar
            return {
                replaceAll: function (source, str1, str2, ignore) {
                    return source.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignore ? "gi" : "g")), (typeof (str2) == "string") ? str2.replace(/\$/g, "$$$$") : str2);
                },
                isSimulator: function () {
                    return window.navigator.simulator == true;
                },
                //Null promise veya parametrede verilen tipde promise dondurmek icin kull.kisayol
                promise: function (p) {
                    return $q.when(p);
                },
                rejectedPromise: function (reason) {
                    var d = $q.defer();
                    d.reject(reason);
                    return d.promise;
                },
                //Verilan value parametresi promise ise direk donduru degilse promise olarak dondurur
                makePromise: function (value) {
                    return this.isPromise(value) ? value : this.promise(value);
                },
                //Value parmetresinin promise olup olmadigini dondurur
                isPromise: function (value) {
                    return value && angular.isFunction(value.then);
                },
                isHtml: function (value) {
                    return value.indexOf('html', value.length - 4) > -1;
                },
                mergeParams: function (objects) {
                    var result = [];
                    for (var i = 0; i < objects.length; i++) {
                        if (angular.isArray(objects[i])) {
                            for (var j = objects[i].length - 1; j >= 0; j--) {
                                result.push(objects[i][j]);
                            }
                        } else {
                            result.push(objects[i]);
                        }
                    }
                    return result;
                },
                mergeArgs: function () {
                    var objects = Array.prototype.slice.call(arguments[0], 0);
                    return this.mergeParams(objects);
                },
                isNullOrEmpty: function (value) {
                    return !this.isAssigned(value) || value.trim() === '';
                },
                isAssigned: function (value) {
                    return value !== undefined && value !== null && value !== "undefined";
                },
                makeArray: function (obj) {
                    if (Object.prototype.toString.call(obj) !== '[object Array]') {
                        obj = [obj];
                    }
                    return obj;
                },
                addTrailingSlash: function (path) {
                    var sonChar = path[path.length - 1];

                    if (sonChar === '/')
                        return path;
                    else
                        return path + '/';
                },
                //this can get rid of digest phase errors
                safeApply: function ($scope, fn) {
                    var phase = $scope.$root.$$phase;
                    if (phase == '$apply' || phase == '$digest') {
                        if (fn) {
                            $scope.$eval(fn);
                        }
                    } else {
                        if (fn) {
                            $scope.$apply(fn);
                        } else {
                            $scope.$apply();
                        }
                    }
                },
                concatAndResolveUrl: function (url, concat) {
                    var url1 = url.split('/');
                    var url2 = concat.split('/');
                    var url3 = [];
                    for (var i = 0, l = url1.length; i < l; i++) {
                        if (url1[i] == '..') {
                            url3.pop();
                        } else if (url1[i] == '.') {
                            continue;
                        } else {
                            url3.push(url1[i]);
                        }
                    }
                    for (var i = 0, l = url2.length; i < l; i++) {
                        if (url2[i] == '..') {
                            url3.pop();
                        } else if (url2[i] == '.') {
                            continue;
                        } else {
                            url3.push(url2[i]);
                        }
                    }
                    return url3.join('/');
                },
                //Base uri'yi verir
                get_BaseUrl: function () {
                    var uri = window.location.href;
                    var ind = uri.indexOf('#');

                    var baseUrl = uri;

                    if (ind > 0) {
                        baseUrl = uri.substr(0, ind);
                    }

                    if (baseUrl[baseUrl.length - 1] != '/') {
                        baseUrl = baseUrl + '/';
                    }
                    return baseUrl;
                },
                //Verilen uri ye parametreleri querystring olarak ekler
                add_QueryString: function myfunction(uri, parameters) {
                    var delimiter = (uri.indexOf('?') == -1) ? '?' : '&';
                    for (var parameterName in parameters) {
                        var parameterValue = parameters[parameterName];
                        uri += delimiter + encodeURIComponent(parameterName) + '=' + encodeURIComponent(parameterValue);
                        delimiter = '&';
                    }
                    return uri;
                }
            };
        }
        ]);
});