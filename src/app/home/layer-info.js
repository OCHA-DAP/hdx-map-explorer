(function (module) {
    module.factory("LayerInfo", function(){
        function LayerInfo($scope, name, type, colors, threshold, values, shapeJoinColumn, mapDataJoinColumn, stepCount,
                            sourceUrl, dataUrl, mapData){
            this.$scope = $scope;
            this.name = name;
            this.type = type;
            this.colors = colors;
            this.threshold = threshold;
            this.values = values;
            this.shapeJoinColumn = shapeJoinColumn;
            this.mapDataJoinColumn = mapDataJoinColumn;
            this.stepCount = stepCount;
            this.sourceUrl = sourceUrl;
            this.dataUrl = dataUrl;
            this.mapData = mapData;
        }
        LayerInfo.prototype = {
            getThresholdIndexByValue: function (value){
                if (!value) {
                    return -1;
                }

                for (var i = 0; i < this.stepCount; i++) {
                    if (value < this.threshold[i]) {
                        return i;
                    }
                }
                return this.colors.length - 1;
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
                var color = (threshold == -1) ? "#000000" : "#ffffff";
                var dashArray = (threshold == -1) ? "5, 10" : null;
                return {
                    weight: 2,
                    opacity: 0.2,
                    color: color,
                    fillOpacity: 0.7,
                    fillColor: this.getColor(pcode),
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
                    content += '<strong>' + elem.tag + '</strong>: ' + elem.value + '<br />';
                });
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

                    this.$scope.$broadcast("layerSelect", [
                        {
                            "type": "select",
                            "options": {
                                "column": this.mapDataJoinColumn,
                                "operator": "=",
                                "value": featureLayer.feature.properties[this.shapeJoinColumn]
                            }
                        }
                    ]);
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