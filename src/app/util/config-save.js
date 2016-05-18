(function(module) {

    module.factory("ConfigManager", function (CkanSaver){

        function ConfigManager($scope) {
            /**
             * This object will be populated with the loaded and modified configs/layers
             * This is the object that will be sent to CKAN and saved in a powerview
             */

            /**
             *
             * @param {string} type choropleth, bubble, etc (check util.js)
             * @returns {?string}
             * @private
             */
            function _findSliceNameByType(type) {
                try {
                    return $scope.layerMap[type].layerInfo.name;
                }
                catch(e) {
                    console.log("Layer name could not be found probably because of missing data");
                }
                return null;
            }
            this.currentConfig = {
                "title": (Math.random() + 1).toString(36) + " - " + new Date().toISOString(),
                "config": []
            };

            $scope.$on("renderSlice", function(event, data){
                this.addSlice(data);
            }.bind(this));
            
            $scope.$on("removeSlice", function(event, data){
                var sliceName = _findSliceNameByType(data);

                // According to the application's logic it's ok to generate removeSlice events
                // even when that slice type doesn't exist.
                if (sliceName) {
                    this.removeSlice(sliceName);
                }
            }.bind(this));

            $scope.$on("changeSlice", function(event, data){
                var sliceName = _findSliceNameByType(data.oldType);
                this.changeLayerType(sliceName, data.newType);
            }.bind(this));

            $scope.$on("chartReplaced", function(event, data){
                var sliceName = _findSliceNameByType(data.type);
                this.changeChartType(sliceName, data.chartName);

            }.bind(this));

            $scope.$on("chartPointClicked", function (event, data) {
                var sliceName = _findSliceNameByType(data);
                this.setChartSelection(sliceName, data.filters);
            }.bind(this));

            $scope.$on("layerSelect", function (event, data) {
                if (!data.name) {
                    data.name = _findSliceNameByType(data.type);
                }
                this.setLayerSelection(data.name, data.filters);
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
            var removeId = this._findSliceIdxByName(sliceName);
            if (removeId >= 0) {
                this.currentConfig.config.splice(removeId, 1);
            }
        };

        ConfigManager.prototype.changeLayerType = function(sliceName, newType){
            var config = this.currentConfig.config[this._findSliceIdxByName(sliceName)];
            var layerTypesArray = config.map.layers[0].type;

            this._moveToStartOfArray(layerTypesArray, function(elem) {
                return elem == newType;
            });

        };

        ConfigManager.prototype.changeChartType = function(sliceName, chartName){
            var config = this.currentConfig.config[this._findSliceIdxByName(sliceName)];

            config.layerSelection = null;
            this._moveToStartOfArray(config.charts, function(elem){
                return elem.name == chartName;
            });
        };

        ConfigManager.prototype.setChartSelection = function(sliceName, additionalFilters) {
            var sliceConfig = this.currentConfig.config[this._findSliceIdxByName(sliceName)];
            // if ( !sliceConfig.chartSelection ){
            //     sliceConfig.chartSelection = [];
            // }
            sliceConfig.chartSelection = additionalFilters ? additionalFilters : null;
        };
        ConfigManager.prototype.setLayerSelection = function(sliceName, additionalFilters) {
            var sliceConfig = this.currentConfig.config[this._findSliceIdxByName(sliceName)];
            // if ( !sliceConfig.layerSelection ){
            //     sliceConfig.layerSelection = [];
            // }
            sliceConfig.layerSelection = additionalFilters ? additionalFilters : null;
        };
        ConfigManager.prototype.saveCurrentConfigToServer = function (title, description) {
            return CkanSaver.saveCurrentConfigToServer(this.currentConfig, title, description);
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


        /**
         * Test function for finding the element to be moved
         * @callback testFunction
         * @param elem - element of the array
         * @returns {boolean}
         */
        /**
         *
         * @param arr The array that should be modified
         * @param {testFunction} testFunction a function called for each element in arr
         * @private
         */
        ConfigManager.prototype._moveToStartOfArray = function(arr, testFunction) {
            if (arr && arr.length) {
                var temp = arr[0];
                for (var i=0; i<arr.length; i++) {
                    if (testFunction(arr[i])){
                        arr[0] = arr[i];
                        arr[i] = temp;
                        break;
                    }
                }
            }
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
                description = "'" + title + "'" + " was created on " + new Date().toISOString();
            }
            
            currentConfig.title = title;

            var promise = $http.post(url, {
                "title": title,
                "description": description,
                "view_type": "Map Explorer",
                "config": currentConfig
            });

            return promise;
        };
    });

}(angular.module("hdx.map.explorer.util")));