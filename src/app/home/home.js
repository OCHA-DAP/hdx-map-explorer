(function (module) {
    module.controller('HomeController', function ($scope, $http, $q, $templateCache, $window, $stateParams, DataFetcher,
                                                  FilterBuilder, BaseLayers, LayerInfo) {
        var model = this;

        var layerGroup = new L.FeatureGroup(), popup = new L.Popup({autoPan: false, offset: L.point(1, -6)});

        var CHOROPLETH_TYPE = "choropleth",
            POINT_TYPE = "point",
            BUBBLE_TYPE = "bubble";

        init();

        function init() {
            buildBaseMap();

            $scope.chartsGroup = {};
            $scope.layerMap = {};
            $scope.popup = popup;

            angular.element($window).bind('resize',broadcastWindowResizeEvent);

            $scope.$on("addSlice", addSlice);
            $scope.$on("removeSlice", removeSlice);
            $scope.$on("chartPointClicked", chartPointClicked);
            $scope.initialSliceId = $stateParams.sliceId;
            //detect touch device
            $scope.isTouch = 'ontouchstart' in document.documentElement;
            $scope.touchManger = null;


            if (true) {
                $scope.touchManger = initTouchManager();
            }


        }

        /**
         * Generate angular app wide resize event
         */
        function broadcastWindowResizeEvent() {
            console.log("Sending resized event");
            $scope.$broadcast("windowResized", {});
        }

        function chartPointClicked(event, data){
            var additionalFilters = data.filters;
            var type = data.type;
            console.log("Filtering for:" + type + " by " + JSON.stringify(additionalFilters));
            var layerInfo = $scope.layerMap[type].layerInfo;

            addLayer(layerInfo.name, layerInfo.sourceUrl, layerInfo.dataUrl, layerInfo.mapData, additionalFilters);
        }

        function addSlice(event, data) {
            var url = data.url;
            loadJson(url).then(
                function (data) {
                    var vizData = data.data;
                    addLayer(vizData.name, vizData.source, vizData.url, vizData.map);
                    var groupData = {};
                    var chartsData = data.data.charts;
                    var layer0Data = data.data.map.layers[0];
                    var layerType = layer0Data.type[0];
                    if (chartsData && chartsData.length) {
                        groupData.colors = layer0Data.colors;
                        var currentTime = new Date();
                        groupData.track = currentTime.getTime();
                        var chartsGroup = $scope.chartsGroup;
                        groupData.charts = chartsData;
                        chartsGroup[layerType] = groupData;
                        $scope.chartsGroup = chartsGroup;
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

            //reset pagination
            $('#chart-pagination .dot:last-child').remove();
            $('#chart-item-holder').css('left','0').css('top','0');
            initTouchManager();
        }

        function loadJson(url) {
            return $http.get(url);
        }

        function buildBaseMap() {
            var map = L.map("map", {zoomControl: true}).setView([10, 10], 5);
            $scope.map = map;
            map.on("resize", function () {
                mapFitBounds();
            });
            BaseLayers.get().CartoDB_Positron.addTo(map);
            //L.control.layers(BaseLayers, null, {collapsed: true, position: "topright"}).addTo(map);
            layerGroup.addTo(map);
        }

        function addLayer(vizDataName, vizDataSource, vizDataUrl, vizDataMap, additionalFilters) {
            var mapData = vizDataMap;
            //var paramList = buildUrlFilterList(mapData.layers[0].operations);
            //var promise1 = DataFetcher.getFilteredDataByParamList(vizData.url, paramList);
            var promise1 = DataFetcher.fetchData(vizDataUrl, mapData.layers[0], additionalFilters);
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

                    var layerInfo = new LayerInfo($scope, vizDataName, layerType, colors, threshold, values,
                        shapeJoinColumn, mapDataJoinColumn, stepCount, vizDataSource, vizDataUrl, mapData);
                    $scope.$broadcast("sliceCreated", layerInfo);

                    switch(layerType){
                        case CHOROPLETH_TYPE:
                            newLayer = L.geoJson(geojson, {
                                style: angular.bind(layerInfo, layerInfo.getChoroplethStyle),
                                onEachFeature: angular.bind(layerInfo, layerInfo.onEachFeature)
                            });
                            break;

                        case POINT_TYPE:
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
                            break;

                        case BUBBLE_TYPE:
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
                            break;

                        default:
                            console.error("Unknown layer type");
                    }

                    if ($scope.layerMap[layerType]){
                        layerGroup.removeLayer($scope.layerMap[layerType]);
                    }
                    $scope.layerMap[layerType]= newLayer;
                    newLayer.values = values;
                    newLayer.colors = colors;
                    newLayer.layerInfo = layerInfo;
                    newLayer.addTo(layerGroup);

                    if ($scope.layerMap[CHOROPLETH_TYPE]){
                        $scope.layerMap[CHOROPLETH_TYPE].bringToFront();
                    }
                    if ($scope.layerMap[BUBBLE_TYPE]){
                        $scope.layerMap[BUBBLE_TYPE].bringToFront();
                    }
                    if ($scope.layerMap[POINT_TYPE]){
                        $scope.layerMap[POINT_TYPE].bringToFront();
                    }

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
                    var chartHolder = $('#chart-item-holder');
                    var hammer = new Hammer(charts);
                    hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
                    hammer.on('swipeleft swiperight swipeup swipedown', function (ev) {
                        var chartW = $('.chart-item').outerWidth();
                        var chartH = $('.chart-item').outerHeight();
                        var chartNum = $('#charts chart-item').length;
                        //portrait mode
                        if (chartHolder.width() > $('body').width()) {
                            if (ev.type == 'swipeleft' && chartIndex < chartNum) {
                                //swipe to the next chart
                                chartHolder.animate({left: '-=' + (chartW - 10) + 'px'});
                                chartIndex++;
                            }
                            if (ev.type == 'swiperight' && chartIndex > 1) {
                                //swipe to previous chart
                                chartHolder.animate({left: '+=' + (chartW - 10) + 'px'});
                                chartIndex--;
                            }
                        }
                        //landscape mode
                        if (chartHolder.height() > $('body').height()) {
                            if (ev.type == 'swipeup' && chartIndex < chartNum) {
                                //swipe to the next chart
                                chartHolder.animate({top: '-=' + (chartH) + 'px'});
                                chartIndex++;
                            }
                            if (ev.type == 'swipedown' && chartIndex > 1) {
                                //swipe to previous chart
                                chartHolder.animate({top: '+=' + (chartH) + 'px'});
                                chartIndex--;
                            }
                        }

                        //set chart pagination
                        $('#chart-pagination .dot').css('opacity', 0.2);
                        $('#chart-pagination .dot:nth-child('+ (chartIndex) +')').css('opacity', 0.6);
                    });

                },
                swipeReset: function () {
                    chartIndex = 1;
                    $('#chart-item-holder').css('left', 'auto');
                    $('#chart-item-holder').removeAttr('style');
                }
            };
            touchManager.swipeInit();
            $scope.$on('windowResized', touchManager.swipeReset);
            return touchManager;
        }

    });
}(angular.module("hdx.map.explorer.home")));