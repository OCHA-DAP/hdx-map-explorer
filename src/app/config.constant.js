(function(module) {

    module.constant("APP_CONFIG", {
        hxlProxy: "https://feature-data.hdx.rwlabs.org/hxlproxy/data.json?",
        ckanUrl: "http://172.17.42.1",
        ckanSavePath: "/api/action/powerview_create",
        ckanLoadPath: "/api/action/powerview_show",
        mapExplorerURL: "http://172.17.42.1/mapx"
    });

}(angular.module("hdx.map.explorer")));