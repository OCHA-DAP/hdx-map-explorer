(function(module) {

    module.constant("APP_CONFIG", {
        hxlProxy: "https://data.humdata.org/hxlproxy/data.json?",
        ckanSavePath: "/api/action/powerview_create",
        ckanLoadPath: "/api/action/powerview_show",
        ckanCheckLogin: "/api/action/am_following_user?id=hdx",
        ckanUrl: "https://data.humdata.org",
        mapExplorerURL: "https://data.humdata.org/mpx"
    });

}(angular.module("hdx.map.explorer")));