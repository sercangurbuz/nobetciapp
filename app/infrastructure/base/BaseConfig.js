'use strict';

define(['Class'], function (Class) {
    //Base Config 
    var BaseConfig = Class.extend({
        //Constructor
        init: function () {
            this.defineDefauts();
        },
        //Varsayilan ayarlarin set edildigi method
        defineDefauts: function () {
            //override
        },
        //Config bilgisini geri dondur
        $get: function () {
            return this;
        }
    });
    //BaseConfig döndur
    return BaseConfig;
});