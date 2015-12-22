'use strict';
/* author      : alper.kilci
 * date        : 8/6/2015 3:46:48 PM 
 */
define(['config/App', 'base/BaseApi'], function (app, BaseApiService) {
    var DataApi = BaseApiService.extend({
        //Database
        db: null,
        //Constructor
        init: function (bundle, plugins) {
            this.plugins = plugins;
            this.db = plugins.openDb("sifanobetci.db");
            this._super(bundle);
        },
        getNobetciById: function (id) {
            console.log('getting nobetci by id ' + id);
            return this.plugins.execSql(this.db, 'select * from tbl_nobetciler where id=?', [id]).then(function (response) {
                if (response.rows.length === 1) {
                    return response.rows.item(0);
                }
                return null;
            });
        },
        getList: function () {
            console.log('getting list');
            return this.plugins.execSql(this.db, 'select * from tbl_nobetciler order by id').then(function (response) {
                var result = [];
                for (var i = 0; i < response.rows.length ; i++) {
                    result.push(response.rows.item(i));
                }
                return result;
            });
        },
        add: function (nobetci) {
            console.log('inserting');
            return this.plugins.execSql(this.db, 'insert into tbl_nobetciler (adsoyad,icon) values (?,?)', [nobetci.adsoyad, nobetci.icon]);
        },
        update: function (nobetci) {
            console.log('updating ' + nobetci.icon);
            return this.plugins.execSql(this.db, 'update tbl_nobetciler set adsoyad=?,icon=? where id=?', [nobetci.adsoyad, nobetci.icon, nobetci.id]);
        }

    });
    //#region Register
    app.addServiceApi('dataApi', DataApi, ['Plugins']);
    //#endregion
});