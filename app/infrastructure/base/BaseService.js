'use strict';

define(['Class', 'underscore'], function (Class, _) {
    //Base Service
    var BaseService = Class.extend({
        //Module Id
        moduleId: '[undefined service]',
        //Undefined ve bull degilse
        isAssigned: function (value) {
            return value !== undefined && value !== null;
        },
        //Extend Obj
        extend: function (src, dest) {
            return _.extend(src, dest);
        },
        //Controller constructor
        init: function (logger) {
            //Logger
            this.logger = logger;
        }
    });
    //BaseService döndür
    return BaseService;
});