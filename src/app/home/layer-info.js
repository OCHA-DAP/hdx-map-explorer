(function (module) {
    module.factory("LayerInfo", function(){
        function LayerInfo($scope, name, type, colors, threshold, values, shapeJoinColumn, mapDataJoinColumn,
                            sourceUrl, dataUrl, mapData){
            this.$scope = $scope;
            this.name = name;
            this.type = type;
            this.colors = colors;
            this.threshold = threshold;
            this.values = values;
            this.shapeJoinColumn = shapeJoinColumn;
            this.mapDataJoinColumn = mapDataJoinColumn;
            this.sourceUrl = sourceUrl;
            this.dataUrl = dataUrl;
            this.mapData = mapData;
        }
        LayerInfo.prototype = {
            /**
             * Example: for colors: ['gray', 'orange', 'red'] and thresholds = [0,50,100]
             * The returned value will be:
             *  - 0 (gray) for values < 50,
             *  - 1 (orange) for 50 <= values <100,
             *  - 2 (red) for  100 <= values
             * @param value the value of the shape we're coloring ( ex number of people )
             * @returns {number} The index of the threshold (which determines the color) for this shape
             */
            getThresholdIndexByValue: function (value){
                if (!value) {
                    return -1;
                }

                if (this.threshold.length) {
                    for (var i = 1; i < this.threshold.length; i++) {
                        if (value < this.threshold[i]) {
                            return i-1;
                        }
                    }
                    return this.colors.length - 1;
                }

                return -1;

            },

            getThresholdIndex: function (pcode) {
                var value = this.values.map[pcode];
                return this.getThresholdIndexByValue(value);
            },

            getColor: function (pcode) {
                var idx = this.getThresholdIndex(pcode);
                if (idx == -1) {
                    return "rgba(0,0,0,0)";
                } else {
                    return this.colors[idx];
                }
            },

            getPointStyle: function (value) {
                var thresholdIndex = this.getThresholdIndexByValue(value);
                var weight = (thresholdIndex == -1) ? 0 : 2;
                return {
                    stroke: true,
                    weight: weight,
                    color: "gray",
                    opacity: 1,
                    fillOpacity: 0.8,
                    fillColor: this.colors[thresholdIndex],
                    radius: 5
                };
            },

            getBubbleStyle: function (feature) {
                var pcode = feature.properties[this.shapeJoinColumn];
                var thresholdIndex = this.getThresholdIndex(pcode);
                var weight = (thresholdIndex == -1) ? 0 : 2;
                return {
                    stroke: true,
                    weight: weight,
                    color: "gray",
                    opacity: 1,
                    fillOpacity: 0.8,
                    fillColor: this.getColor(pcode),
                    radius: (thresholdIndex + 1) * 3
                };
            },

            getChoroplethStyle: function (feature) {
                var pcode = feature.properties[this.shapeJoinColumn];
                var threshold = this.getThresholdIndex(pcode);
                var isEmpty = threshold == -1;
                var color = ( isEmpty) ? "#000000" : "#ffffff";
                var dashArray = (isEmpty) ? "5, 10" : null;
                var weight = (isEmpty) ? 2 : 2;
                var fillColor = (isEmpty) ? "#dddddd" : this.getColor(pcode);
                return {
                    weight: weight,
                    opacity: 0.2,
                    color: color,
                    fillOpacity: 0.7,
                    fillColor: fillColor,
                    dashArray: dashArray
                };
            },

            onLayerMouseMove: function (e) {
                var layer = e.target;
                var popup = this.$scope.popup;
                popup.setLatLng(e.latlng);
                var infoList;
                if (layer.infoList) {
                    // in case it is a point layer we get the infoList from the layer
                    infoList = layer.infoList;
                }
                else {
                    var pcode = layer.feature.properties[this.shapeJoinColumn];
                    infoList = this.values.infoMap[pcode];
                }

                //popup.setContent("<div><strong>" + pcode + "</strong>: " + values.map[pcode] + "</div>");
                var content = '';
                $.each(infoList, function (idx, elem) {
                    var title = this.mapData.columnNames ? this.mapData.columnNames[elem.tag] : elem.tag;
                    if (!title){
                        title = elem.tag;
                    }
                    content += '<strong>' + title + '</strong>: ' + (elem.value || "No data") + '<br />';
                }.bind(this));
                if (content === ''){
                    content = "No data!";
                }
                popup.setContent('<div class="map-info-popup">' + content + '</div>');

                if (!popup._map) {
                    popup.openOn(this.$scope.map);
                }
                window.clearTimeout(popup.closeTooltip);
                var mapInfoPopup = $('.map-info-popup');
                mapInfoPopup.mouseover(angular.bind(this, function (e) {
                    window.clearTimeout(popup.closeTooltip);
                }));
                mapInfoPopup.mouseout(angular.bind(this, this.onLayerMouseOut));
            },

            closePopup: function () {
                this.$scope.map.closePopup();
            },

            onLayerMouseOut: function (e) {
                var popup = this.$scope.popup;
                popup.closeTooltip = window.setTimeout(angular.bind(this, this.closePopup), 350);
            },
            onLayerClick: function (e) {
                var currentLayer = this.$scope.layerMap[this.type];
                var featureLayer = e.target;
                var pcode = featureLayer.feature.properties[this.shapeJoinColumn];
                var threshold = this.getThresholdIndex(pcode);
                if (threshold != -1){
                    if (this.$scope.selectedLayer) {
                        this.$scope.selectedLayer.resetStyle(this.$scope.selectedFeature);
                    }
                    this.$scope.selectedLayer = currentLayer;
                    this.$scope.selectedFeature = featureLayer;

                    var newStyle = $.extend(this.getChoroplethStyle(featureLayer.feature), {
                        weight: 6,
                        opacity: 1,
                        color: "red"
                    });
                    featureLayer.setStyle(newStyle);

                    var data = {
                        name: this.name,
                        type: this.type,
                        filters: [
                            {
                                "type": "select",
                                "options": {
                                    "column": this.mapDataJoinColumn,
                                    "operator": "=",
                                    "value": featureLayer.feature.properties[this.shapeJoinColumn]
                                }
                            }
                        ]
                    };
                    this.$scope.$broadcast("layerSelect", data);
                }

                if (this.$scope.isTouch) {
                    //show tooltip on click for touch devices
                    this.onLayerMouseMove(e);
                }
            },
            onEachFeature: function (feature, layer) {
                layer.on({
                    mousemove: angular.bind(this, this.onLayerMouseMove),
                    mouseout: angular.bind(this, this.onLayerMouseOut),
                    click: angular.bind(this, this.onLayerClick)
                });
            }
        };

        return (LayerInfo);
    });
}(angular.module("hdx.map.explorer.home")));