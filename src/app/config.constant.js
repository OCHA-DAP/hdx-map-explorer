(function(module) {

    module.constant("APP_CONFIG", {
        hxlProxy: "https://data.hdx.rwlabs.org/hxlproxy/data.json?",
        ckanSavePath: "/api/action/powerview_create",
        ckanLoadPath: "/api/action/powerview_show",
        ckanCheckLogin: "/api/action/am_following_user?id=hdx",
        ckanUrl: "https://data.hdx.rwlabs.org",
        mapExplorerURL: "https://data.hdx.rwlabs.org/mpx"
    });

}(angular.module("hdx.map.explorer")));
