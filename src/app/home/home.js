(function (module) {
    module.controller('HomeController', function ($scope, $http, $q, $templateCache, $window, DataFetcher, FilterBuilder,
                                                  BaseLayers, LayerInfo) {
        var model = this;

        var layerGroup = new L.FeatureGroup(), popup = new L.Popup({autoPan: false, offset: L.point(1, -6)}),
            closeTooltip, currentLayer;
        var mapData;

        init();

        function init() {
            $scope.chartsGroup = {};
            $scope.layerMap = {};
            $scope.popup = popup;

            $scope.$on("addSlice", addSlice);
            $scope.$on("removeSlice", removeSlice);
            $scope.$on("chartPointClicked", chartPointClicked);

            //detect touch device
            $scope.isTouch = 'ontouchstart' in document.documentElement;
            $scope.touchManger = null;
            if (true) {
                $scope.touchManger = initTouchManager();
            }

            buildBaseMap();
        }

        function chartPointClicked(event, additionalFilters){
            console.log("Filtering by " + JSON.stringify(additionalFilters));
            //TODO:
        }

        function addSlice(event, data) {
            var url = data.url;
            loadJson(url).then(
                function (data) {
                    addLayer(data.data);
                    var chartsData = data.data.charts;
                    var layerType = data.data.map.layers[0].type[0];
                    if (chartsData && chartsData.length) {
                        $scope.chartsGroup[layerType] = chartsData;
                    }
                    model.url = data.data.url;
                }
            );
        }

        function removeSlice(event, data){
            var type = data;
            var layer = $scope.layerMap[type];

            if (layer){
                layerGroup.removeLayer(layer);
            }

            var chartsGroup = $scope.chartsGroup;
            delete chartsGroup[type];
            $scope.chartsGroup = chartsGroup;
        }

        function loadJson(url) {
            return $http.get(url);
        }

        function buildBaseMap() {
            var map = L.map("map", {zoomControl: true}).setView([51.505, -0.09], 7);
            $scope.map = map;
            map.on("resize", function () {
                mapFitBounds();
            });
            BaseLayers.CartoDB_Positron.addTo(map);
            //L.control.layers(BaseLayers, null, {collapsed: true, position: "topright"}).addTo(map);
            layerGroup.addTo(map);
        }

        function addLayer(vizData) {
            mapData = vizData.map;
            //var paramList = buildUrlFilterList(mapData.layers[0].operations);
            //var promise1 = DataFetcher.getFilteredDataByParamList(vizData.url, paramList);
            var promise1 = DataFetcher.fetchData(vizData.url, mapData.layers[0]);
            var promise2 = {};
            if (mapData.shapefile) {
                promise2 = $http.get(mapData.shapefile.url);
            }

            $q.all([promise1, promise2]).then(
                function (promiseValues) {
                    var data = promiseValues[0].data,
                        geojson = promiseValues[1].data;
                    var firstLayer = mapData.layers[0];
                    var values = angular.bind(this, generatePcodeValueMap)(data, firstLayer);
                    var stepCount = 10;
                    var colors = firstLayer.colors;
                    var step = (values.max - values.min) / stepCount;
                    var threshold = firstLayer.threshold;
                    if (!threshold) {
                        threshold = [];
                        for (var sIdx = 0; sIdx < stepCount; sIdx++) {
                            threshold.push(values.min + sIdx * step);
                        }
                    }

                    var newLayer;
                    var layerType = firstLayer.type[0];
                    //var layerInfo = {
                    //    name: vizData.name,
                    //    threshold: threshold,
                    //    colors: colors,
                    //    type: layerType
                    //};
                    var shapeJoinColumn;
                    if (mapData && mapData.shapefile) {
                        shapeJoinColumn = mapData.shapefile.joinColumn;
                    }
                    var mapDataJoinColumn = firstLayer.joinColumn;

                    var layerInfo = new LayerInfo($scope, vizData.name, layerType, colors, threshold, values,
                        shapeJoinColumn, mapDataJoinColumn, stepCount);
                    $scope.$broadcast("sliceCreated", layerInfo);

                    if (layerType == "choropleth") {
                        newLayer = L.geoJson(geojson, {
                            style: angular.bind(layerInfo, layerInfo.getChoroplethStyle),
                            onEachFeature: angular.bind(layerInfo, layerInfo.onEachFeature)
                        });
                        newLayer.setZIndex(10);
                    }
                    else if (layerType == 'point') {
                        var points = [];
                        var clusterGroup = L.markerClusterGroup({spiderfyDistanceMultiplier: 1.3});
                        var latIndex, longIndex;
                        for (var i = 0; i < data[1].length; i++) {
                            if (data[1][i] == mapData.layers[0].latColumn) {
                                latIndex = i;
                            }
                            else if (data[1][i] == mapData.layers[0].longColumn) {
                                longIndex = i;
                            }
                        }

                        $.each(data, function (idx, dataLine) {
                            if (idx > 1) {
                                var lat = dataLine[latIndex], long = dataLine[longIndex];
                                var marker = L.circleMarker(L.latLng(lat, long), layerInfo.getPointStyle(dataLine[20]));

                                var infoList = [];
                                for (var i = 0; i < dataLine.length; i++) {
                                    var hxlTag = data[1][i];
                                    if (hxlTag) {
                                        infoList.push({tag: hxlTag, value: dataLine[i]});
                                    }
                                }

                                marker.on("mousemove", angular.bind(layerInfo, layerInfo.onLayerMouseMove));
                                marker.on("mouseout", angular.bind(layerInfo, layerInfo.onLayerMouseOut));
                                marker.infoList = infoList;
                                points.push(marker);
                            }
                        });
                        clusterGroup.addLayers(points);
                        newLayer = clusterGroup;
                        newLayer.setZIndex(12);
                    }
                    else if (layerType == 'bubble'){
                        var markers = [];
                        $.each(geojson.features, function (idx, geo) {
                            var poly = L.geoJson(geo);
                            var pcode = geo.properties[mapData.shapefile.joinColumn];
                            if (layerInfo.getThresholdIndex(pcode) > -1) {
                                var marker = L.circleMarker(poly.getBounds().getCenter(), layerInfo.getBubbleStyle(geo));

                                markers.push(marker);
                                marker.feature = geo;
                                marker.on("click", angular.bind(layerInfo, layerInfo.onLayerClick));
                                marker.on("mousemove", angular.bind(layerInfo, layerInfo.onLayerMouseMove));
                                marker.on("mouseout", angular.bind(layerInfo, layerInfo.onLayerMouseOut));
                                //marker.addTo(map);
                            }
                        });
                        newLayer = L.featureGroup(markers);
                        newLayer.resetStyle = function (layer) {
                            layer.setStyle(layerInfo.getBubbleStyle(layer.feature));
                        };
                        newLayer.setZIndex(11);
                    }
                    else {
                        console.error("Unknown layer type");
                    }

                    if ($scope.layerMap[layerType]){
                        layerGroup.removeLayer($scope.layerMap[layerType]);
                    }
                    $scope.layerMap[layerType]= newLayer;
                    newLayer.values = values;
                    newLayer.colors = colors;
                    newLayer.addTo(layerGroup);

                    mapFitBounds();

                }, function (err) {
                    console.error(err);
                }
            );
        }

        function generatePcodeValueMap(data, layerData) {
            var pCodeValueMap = {};
            var pCodeInfoMap = {};
            var pcodeIndex, valueIndex;
            var hxlRow = data[1];
            for (var i = 0; i < hxlRow.length; i++) {
                if (hxlRow[i] == layerData.joinColumn) {
                    pcodeIndex = i;
                }
                if (hxlRow[i] == layerData.valueColumn) {
                    valueIndex = i;
                }
            }

            var min = null, max = null;
            for (var j = 2; j < data.length; j++) {
                var value = data[j][valueIndex];
                var infoList = [];
                for (var k = 0; k < data[j].length; k++) {
                    infoList.push({'tag': hxlRow[k], 'value': data[j][k]});
                }
                pCodeInfoMap[data[j][pcodeIndex]] = infoList;
                pCodeValueMap[data[j][pcodeIndex]] = value;

                if (min == null || min > value) {
                    min = value;
                }
                if (max == null || max < value) {
                    max = value;
                }
            }

            return {
                map: pCodeValueMap,
                infoMap: pCodeInfoMap,
                min: min,
                max: max
            };
        }

        function mapFitBounds() {
            var padding = [0, 0];
            if ($scope.map._container) {
                if ($scope.map._container.clientWidth > $scope.map._container.clientHeight) {
                    padding = [Math.floor($scope.map._container.clientWidth * 0.25), 0];
                } else {
                    padding = [0, Math.floor($scope.map._container.clientHeight * 0.25)];
                }
            }
            $scope.map.fitBounds(layerGroup.getBounds(), {paddingBottomRight: padding});
        }

        function initTouchManager() {
            var chartIndex = 1;
            var touchManager =  {
                swipeInit: function () {
                    //swipe events for charts on touch devices
                    var charts = document.getElementById('charts');
                    var hammer = new Hammer(charts);
                    hammer.on('swipeleft swiperight', function (ev) {
                        var chartW = $('.chart-item').outerWidth();
                        var chartNum = $('#charts .chart-item').length;
                        if ($(charts).width() > $('body').width()) {
                            if (ev.type == 'swipeleft' && chartIndex < chartNum) {
                                //swipe to the next chart
                                $('#charts').animate({left: '-=' + (chartW + 10) + 'px'});
                                chartIndex++;
                            }
                            if (ev.type == 'swiperight' && chartIndex > 1) {
                                //swipe to previous chart
                                $('#charts').animate({left: '+=' + (chartW + 10) + 'px'});
                                chartIndex--;
                            }
                        }
                    });

                },
                swipeReset: function () {
                    chartIndex = 1;
                    $('#charts').css("left", "auto");
                }
            };
            touchManager.swipeInit();
            angular.element($window).bind('resize',touchManager.swipeReset);
            return touchManager;
        }

    });
}(angular.module("hdx.map.explorer.home")));