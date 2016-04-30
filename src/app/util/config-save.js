(function(module) {

    module.factory("ConfigManager", function (CkanSaver){

        function ConfigManager($scope) {
            /**
             * This object will be populated with the loaded and modified configs/layers
             * This is the object that will be sent to CKAN and saved in a powerview
             */
            this.currentConfig = {
                "title": (Math.random() + 1).toString(36) + " - " + new Date().toISOString(),
                "config": []
            };
            $scope.$on("renderSlice", function(event, data){
                this.addSlice(data);
            }.bind(this));
            
            $scope.$on("removeSlice", function(event, data){
                var sliceName = $scope.layerMap[data].layerInfo.name;
                this.removeSlice(sliceName);
            }.bind(this));

            $scope.$on("chartPointClicked", function (event, data) {
                var sliceName = $scope.layerMap[data.type].layerInfo.name;
                this.addChartSelection(sliceName, data.filters);
            }.bind(this));

            $scope.$on("layerSelect", function (event, data) {
                this.addLayerSelection(data.name, data.filters);
            }.bind(this));
        }
        /**
         *
         * @param slice Entire object with slice configuration
         */
        ConfigManager.prototype.addSlice = function(slice) {
            this.currentConfig.config.push(slice);
        };
        /**
         * @param {string} sliceName Name of the config/slice to be removed
         */
        ConfigManager.prototype.removeSlice = function(sliceName) {
            var removeId = findSliceByName(sliceName);
            if (removeId >= 0) {
                this.currentConfig.config.slice(removeId, 1);
            }
        };
        ConfigManager.prototype.addChartSelection = function(sliceName, additionalFilters) {
            var sliceConfig = this.currentConfig.config[this._findSliceIdxByName(sliceName)];
            if ( !sliceConfig.chartSelection ){
                sliceConfig.chartSelection = [];
            }
            sliceConfig.chartSelection = sliceConfig.chartSelection.concat(additionalFilters);
        };
        ConfigManager.prototype.addLayerSelection = function(sliceName, additionalFilters) {
            var sliceConfig = this.currentConfig.config[this._findSliceIdxByName(sliceName)];
            if ( !sliceConfig.layerSelection ){
                sliceConfig.layerSelection = [];
            }
            sliceConfig.layerSelection = sliceConfig.layerSelection.concat(additionalFilters);
        };
        ConfigManager.prototype.saveCurrentConfigToServer = function (title, description) {
            CkanSaver.saveCurrentConfigToServer(this.currentConfig, title, description);
        };

        ConfigManager.prototype.getCurrentConfig = function() {
            return this.currentConfig;
        };

        ConfigManager.prototype._findSliceIdxByName = function(sliceName) {
            var idx = -1;
            for (var i = 0; i < this.currentConfig.config.length; i++) {
                if (this.currentConfig.config[i].name == sliceName) {
                    idx = i;
                    break;
                }
            }
            return idx;
        };

        return ConfigManager;
    });
}(angular.module("hdx.map.explorer.util")));

(function(module) {
    module.service("CkanSaver", function ($http, APP_CONFIG){
        this.saveCurrentConfigToServer = function (currentConfig, title, description) {
            var url = APP_CONFIG.ckanUrl + APP_CONFIG.ckanSavePath;

            if (!title) {
                description = title = currentConfig.title;
            }
            else if (!description) {
                description = title + " - " + new Date().toISOString();
            }
            
            currentConfig.title = title;

            $http.post(url, {
                "title": title,
                "description": description,
                "view_type": "Map Explorer",
                "config": currentConfig
            });
        };
    });

}(angular.module("hdx.map.explorer.util")));