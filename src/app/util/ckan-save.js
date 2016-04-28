(function(module) {
    module.service("CkanSaver", function ($http, APP_CONFIG){
        this.saveCurrentConfigToServer = function (currentConfig) {
            var url = APP_CONFIG.ckanUrl + APP_CONFIG.ckanSavePath;
            $http.post(url, {
                "title": "Powerview Title",
                "description": "Description",
                "view_type": "Type A",
                "config": currentConfig
            });
        };
    });

}(angular.module("hdx.map.explorer.util")));