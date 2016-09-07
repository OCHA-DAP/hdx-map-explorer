(function (module) {
    module.controller('HomeController', function ($scope, $http, $q, $templateCache, $window, $stateParams, DataFetcher,
                                                  FilterBuilder, BaseLayers, LayerInfo, LayerTypes, ConfigManager) {
        var model = this;

        var layerGroup = new L.FeatureGroup(), popup = new L.Popup({autoPan: false, offset: L.point(1, -6)});


        /**
         * TODO: This variable is global for testing purposes. Just until it'll be linked to button/events.
         * manager for the map explorer configuration.
         * @type {ConfigManager}
         */
        configManager = $scope.configManager = new ConfigManager($scope);

        init();

        function init() {
            buildBaseMap();

            $scope.chartsGroup = {};
            $scope.layerMap = {};
            $scope.popup = popup;
            $scope.chartPaginationIndex = 0;

            angular.element($window).bind('resize', broadcastWindowResizeEvent);

            $scope.$on("addSlice", addSlice);
            $scope.$on("removeSlice", removeSlice);
            $scope.$on("resetSlice", resetSlice);
            $scope.$on("changeSlice", changeSlice);
            $scope.$on("chartPointClicked", chartPointClicked);
            $scope.initialSliceId = $stateParams.sliceId;
            $scope.crisisName = $stateParams.name;
            //detect touch device
            $scope.isTouch = 'ontouchstart' in document.documentElement;
            $scope.touchManager = null;

            $scope.sizeOf = function(obj) {
                return Object.keys(obj).length;
            };

            $scope.loggedIn = false;
            configManager.isLoggedInPromise().then(function(loggedIn){
                $scope.loggedIn = loggedIn;
            });

            if (true) {
                $scope.touchManager = initTouchManager();
            }

            if ($scope.loadConfigUrl) {
                $scope.$emit("addSlice", {url: $scope.loadConfigUrl});
            }


        }

        /**
         * Generate angular app wide resize event
         */
        function broadcastWindowResizeEvent() {
            console.log("Sending resized event");
            $scope.$broadcast("windowResized", {});
        }

        function chartPointClicked(event, data) {
            var additionalFilters = data.filters;
            var type = data.type;
            console.log("Filtering for:" + type + " by " + JSON.stringify(additionalFilters));
            var layerInfo = $scope.layerMap[type].layerInfo;
            layerInfo.filters = additionalFilters;

            addLayer(layerInfo.name, layerInfo.sourceUrl, layerInfo.dataUrl, layerInfo.mapData, type, layerInfo.filters);
        }

        function resetSlice(event, data) {
            chartPointClicked(event, {
                type: data,
                filters: null
            });

            $scope.$broadcast("layerSelect", {
                type: data
            });
        }

        function changeSlice(event, data) {
            var currentLayer = $scope.layerMap[data.oldType];

            if (checkType(currentLayer.types, data.newType)){
                var layerInfo = currentLayer.layerInfo;
                var chartsGroup = $scope.chartsGroup;

                chartsGroup[data.newType] = chartsGroup[data.oldType];
                $scope.chartsGroup = chartsGroup;
                addLayer(layerInfo.name, layerInfo.sourceUrl, layerInfo.dataUrl, layerInfo.mapData, data.newType, layerInfo.filters);
                removeSlice(null, data.oldType);
            } else {
                alert("Change not possible!");
            }
        }

        function checkType(types, newType){
            for (var i = 0; i < types.length; i++){
                var type = types[i];
                if (type == newType){
                    return true;
                }
            }
            return false;
        }

        function addSlice(event, data) {
            var url = data.url;
            var overwrittenGeojsonUrl = null;

            function parseData(data) {
                var configData = data.data;
                if (configData.result && configData.success) { // If config comes from CKAN powerview
                    configData = configData.result.config.config;
                }
                if (!angular.isArray(configData)){
                    configData = [configData];
                }
                return configData;
            }

            function populateScope(data) {
                var configData = data.data;
                if (configData.result && configData.success) { // If config comes from CKAN powerview
                    $scope.configName = configData.result.title;
                    $scope.configDescription = configData.result.description;
                    $scope.configCreator = "";

                    var crisisName = configData.result.config.crisisName;
                    crisisName = crisisName ? crisisName : "lake-chad";
                    $scope.crisisName = crisisName;

                    if ( !configData.result.config.configVersion ) {
                        // For old saved poweviews we need to compute the path to the geojson
                        overwrittenGeojsonUrl = "assets/json/crisis/" + crisisName + "/boundaries.geojson";
                    }
                }
            }

            loadJson(url).then(
                function (data) {
                    var configList = parseData(data);
                    populateScope(data);
                    var currentTime = new Date().getTime();
                    for (var i=0; i<configList.length; i++){
                        var vizData = configList[i];
                        $scope.$emit("renderSlice", vizData);

                        var layer0Data = vizData.map.layers[0];
                        var layerType = layer0Data.type[0];
                        if (overwrittenGeojsonUrl && vizData.map.shapefile) {
                            vizData.map.shapefile.url = overwrittenGeojsonUrl;
                        }
                        removeSlice(null, layerType);
                        addLayer(vizData.name, vizData.sourceUrl, vizData.url, vizData.map, layerType, vizData.chartSelection);
                        var groupData = {};
                        var chartsData = vizData.charts;
                        if (chartsData && chartsData.length) {
                            groupData.colors = layer0Data.colors;
                            groupData.track = currentTime + i;
                            var chartsGroup = $scope.chartsGroup;
                            groupData.charts = chartsData;
                            groupData.url = vizData.url;
                            groupData.selections = {
                                chartSelection: vizData.chartSelection,
                                layerSelection: vizData.layerSelection
                            };
                            chartsGroup[layerType] = groupData;
                            $scope.chartsGroup = chartsGroup;
                        }
                    }
                }
            );
        }

        function removeSlice(event, data) {
            var type = data;
            var layer = $scope.layerMap[type];

            if (layer) {
                layerGroup.removeLayer(layer);
                delete $scope.layerMap[type];
            }

            var chartsGroup = $scope.chartsGroup;
            delete chartsGroup[type];
            $scope.chartsGroup = chartsGroup;
            $scope.touchManager.swipeReset();
        }

        function loadJson(url) {
            return $http.get(url);
        }

        function buildBaseMap() {
            var map = L.map("map", {zoomControl: true});//.setView([10, 10], 5);
            $scope.map = map;
            //Disabled per HDX-4811
            // map.on("resize", function () {
            //     mapFitBounds();
            // });
            BaseLayers.get().OpenStreetMap_HOT.addTo(map);
            //L.control.layers(BaseLayers, null, {collapsed: true, position: "topright"}).addTo(map);
            layerGroup.addTo(map);
        }

        function addLayer(vizDataName, vizDataSource, vizDataUrl, vizDataMap, type, additionalFilters) {
            var mapData = vizDataMap;
            var firstLayer = mapData.layers[0];
            if (LayerTypes.CHART_ONLY != type) {
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
                        var values = angular.bind(this, generatePcodeValueMap)(data, firstLayer);

                        var colors = firstLayer.colors;

                        var threshold = firstLayer.threshold;
                        if (!threshold) {
                            threshold = [];
                            var stepCount = colors.length;
                            var step = (values.max - values.min) / stepCount;
                            for (var sIdx = 0; sIdx < stepCount; sIdx++) {
                                threshold.push(values.min + sIdx * step);
                            }
                        }

                        var newLayer;
                        var layerType = firstLayer.type[0];
                        if (type) {
                            layerType = type;
                        }

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
                            shapeJoinColumn, mapDataJoinColumn, vizDataSource, vizDataUrl, mapData);

                        switch (layerType) {
                            case LayerTypes.CHOROPLETH_TYPE:
                                newLayer = L.geoJson(geojson, {
                                    style: angular.bind(layerInfo, layerInfo.getChoroplethStyle),
                                    onEachFeature: angular.bind(layerInfo, layerInfo.onEachFeature)
                                });
                                break;

                            case LayerTypes.POINT_TYPE:
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

                            case LayerTypes.BUBBLE_TYPE:
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

                        // Don't remove check it is being used as a check for when we refresh the layer on various events
                        if ($scope.layerMap[layerType]) {
                            layerGroup.removeLayer($scope.layerMap[layerType]);
                        }

                        $scope.layerMap[layerType] = newLayer;
                        newLayer.values = values;
                        newLayer.colors = colors;
                        newLayer.types = firstLayer.type;
                        newLayer.layerInfo = layerInfo;
                        newLayer.addTo(layerGroup);
                        $scope.$broadcast("sliceCreated", newLayer);

                        if ($scope.layerMap[LayerTypes.CHOROPLETH_TYPE]) {
                            $scope.layerMap[LayerTypes.CHOROPLETH_TYPE].bringToFront();
                        }
                        if ($scope.layerMap[LayerTypes.BUBBLE_TYPE]) {
                            $scope.layerMap[LayerTypes.BUBBLE_TYPE].bringToFront();
                        }
                        if ($scope.layerMap[LayerTypes.POINT_TYPE]) {
                            $scope.layerMap[LayerTypes.POINT_TYPE].bringToFront();
                        }

                        //Disabled per HDX-4811
                        // mapFitBounds();

                    }, function (err) {
                        console.error(err);
                    }
                );
            }
            else {
                var legendColors = firstLayer.colors.slice(0);
                if ( legendColors.length == 1){
                    for (var i=0; i<5; i++) {
                        legendColors.push(legendColors[0]);
                    }
                }
                var fakeLayer = {
                    colors: legendColors,
                    types:firstLayer.types,
                    layerInfo: {
                        name: vizDataName,
                        type: type,
                        colors: legendColors,
                        sourceUrl: vizDataSource
                    }
                };
                $scope.layerMap[type] = fakeLayer;
                $scope.$broadcast("sliceCreated", fakeLayer);
            }
            $scope.$broadcast("windowResized", {}); //resize event so if we have more than 2 charts they get will redraw
        }

        function generatePcodeValueMap(data, layerData) {
            var pCodeValueMap = {};
            var pCodeInfoMap = {};
            var pcodeIndex, valueIndex;
            var columnRow = data[0];
            var hxlRow = data[1];
            var columnNames = {};

            for (var i = 0; i < hxlRow.length; i++) {
                if (hxlRow[i] == layerData.joinColumn) {
                    pcodeIndex = i;
                }
                if (hxlRow[i] == layerData.valueColumn) {
                    valueIndex = i;
                }
                columnNames[hxlRow[i]] = columnRow[i];
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
                columnNames: columnNames,
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
            console.log("initTouchManager");
            var chartIndex = 0;
            var touchManager = {
                swipeInit: function () {
                    //swipe events for charts on touch devices
                    var charts = document.getElementById('charts');
                    var chartHolder = $('#chart-item-holder');
                    var hammer = new Hammer(charts);
                    hammer.get('swipe').set({direction: Hammer.DIRECTION_ALL});
                    hammer.on('swipeleft swiperight swipeup swipedown', function (ev) {
                        var chartW = $('.chart-item').outerWidth();
                        var chartH = $('.chart-item').outerHeight();
                        var chartNum = $('#charts chart-item').length;
                        chartIndex = $('#chart-pagination').data('index');
                        //console.log("------hammer swipe", ev.type);
                        //portrait mode
                        if (chartHolder.width() > $('body').width()) {
                            if (ev.type == 'swipeleft' && chartIndex < chartNum-1) {
                                //swipe to the next chart
                                chartIndex++;
                            }
                            if (ev.type == 'swiperight' && chartIndex > 0) {
                                //swipe to previous chart
                                chartIndex--;
                            }
                            chartHolder.animate({left: '-' + (chartW * chartIndex) + 'px'});
                        }
                        //landscape mode
                        if (chartHolder.height() > $('body').height()) {
                            if (ev.type == 'swipeup' && chartIndex < chartNum) {
                                //swipe to the next chart
                                chartIndex++;
                            }
                            if (ev.type == 'swipedown' && chartIndex > 0) {
                                //swipe to previous chart
                                chartIndex--;
                            }
                            chartHolder.animate({top: '-' + (chartH * chartIndex) + 'px'});
                        }

                        //set chart pagination
                        //setChartPagination(chartIndex);
                        $scope.chartPaginationIndex = chartIndex;
                        touchManager.swipePagination(chartIndex);
                    });

                },
                swipeReset: function () {
                    chartIndex = 0;
                    //setChartPagination(chartIndex);
                    touchManager.swipePagination(chartIndex);
                },
                swipePagination: function(id) {
                    $('#chart-pagination .dot').removeClass('active');
                    $('#chart-pagination .dot:nth-child(' + (id+1) + ')').addClass('active');
                    $('#chart-pagination').data('index', id);
                    if (id===0){
                        $('#chart-item-holder').removeAttr('style');
                        $('#chart-item-holder').css('left', 0).css('top', 0);
                    }
                }
            };
            touchManager.swipeInit();
            $scope.$on('windowResized', touchManager.swipeReset);
            return touchManager;
        }

        // function setChartPagination(id){
        //     $('#chart-pagination .dot').removeClass('active');
        //     $('#chart-pagination .dot:nth-child(' + (id+1) + ')').addClass('active');
        //     $('#chart-pagination').data('index', id);
        //     if (id===0){
        //         $('#chart-item-holder').removeAttr('style');
        //         $('#chart-item-holder').css('left', 0).css('top', 0);
        //     }
        // }

    });
}(angular.module("hdx.map.explorer.home")));