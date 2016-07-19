(function(module) {

    module.constant("APP_CONFIG", {
        hxlProxy: "https://feature-data.humdata.org/hxlproxy/data.json?",
        ckanSavePath: "/api/action/powerview_create",
        ckanCheckLogin: "/api/action/am_following_user?id=hdx",
        ckanUrl: "https://feature-data.humdata.org",
        mapExplorerURL: "https://feature-data.humdata.org/mpx"
    });

}(angular.module("hdx.map.explorer")));
