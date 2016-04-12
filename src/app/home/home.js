(function (module) {
    module.controller('HomeController', function ($scope, $http, $q, $templateCache, DataFetcher, FilterBuilder,
                                                  BaseLayers) {
        var model = this;

        var layerGroup = new L.FeatureGroup(), popup = new L.Popup({autoPan: false, offset: L.point(1, -6)}),
            closeTooltip, currentLayer;
        var mapData;
        var isTouch;

        init();

        function init() {
            $scope.chartsGroup = {};
            $scope.layerMap = {};

            buildBaseMap();
            $scope.$on("addSlice", addSlice);
            $scope.$on("removeSlice", removeSlice);

            //detect touch device
            isTouch = 'ontouchstart' in document.documentElement;
            if (isTouch) {
                initTouch();
            }

            /* TODO: Dummy event handler. This should be enhanced to filter the corresponding map layer on chart click */
            $scope.$on("chartPointClicked", function (event, additionalFilters) {
                console.log("Filtering by " + JSON.stringify(additionalFilters));
            });
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
            var map = L.map("map", {zoomControl: false}).setView([51.505, -0.09], 7);
            $scope.map = map;
            map.on("resize", function () {
                mapFitBounds();
            });
            BaseLayers.CartoDB_Positron.addTo(map);
            L.control.layers(BaseLayers, null, {collapsed: true, position: "topleft"}).addTo(map);
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
                    var values = generatePcodeValueMap(data);
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
                    $scope.$broadcast("sliceCreated", {
                        name: vizData.name,
                        threshold: threshold,
                        colors: colors,
                        type: layerType
                    });

                    function getPointStyle(value) {
                        var thresholdIndex, fillColor;
                        for (var i = 0; i < stepCount; i++) {
                            if (value < threshold[i]) {
                                thresholdIndex = i;
                                break;
                            }
                        }
                        var weight = (thresholdIndex == -1) ? 0 : 2;
                        return {
                            stroke: true,
                            weight: weight,
                            color: "gray",
                            opacity: 1,
                            fillOpacity: 0.8,
                            fillColor: colors[thresholdIndex],
                            radius: 5
                        };
                    }

                    function getMarkerStyle(geo) {
                        var pcode = geo.properties[mapData.shapefile.joinColumn];
                        var thresholdIndex = getThresholdIndex(pcode);
                        var weight = (thresholdIndex == -1) ? 0 : 2;
                        return {
                            stroke: true,
                            weight: weight,
                            color: "gray",
                            opacity: 1,
                            fillOpacity: 0.8,
                            fillColor: getColor(pcode),
                            radius: ( thresholdIndex + 1) * 3
                        };
                    }
                    if (layerType == "choropleth") {
                        newLayer = L.geoJson(geojson, {
                            style: getStyle,
                            onEachFeature: onEachFeature
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
                                var marker = L.circleMarker(L.latLng(lat, long), getPointStyle(dataLine[20]));

                                var infoList = [];
                                for (var i = 0; i < dataLine.length; i++) {
                                    var hxlTag = data[1][i];
                                    if (hxlTag) {
                                        infoList.push({tag: hxlTag, value: dataLine[i]});
                                    }
                                }

                                marker.on("mousemove", onLayerMouseMove);
                                marker.on("mouseout", onLayerMouseOut);
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
                            if (getThresholdIndex(pcode) > -1) {
                                var marker = L.circleMarker(poly.getBounds().getCenter(), getMarkerStyle(geo));

                                markers.push(marker);
                                marker.feature = geo;
                                marker.on("click", onLayerClick);
                                marker.on("mousemove", onLayerMouseMove);
                                marker.on("mouseout", onLayerMouseOut);
                                //marker.addTo(map);
                            }
                        });
                        newLayer = L.featureGroup(markers);
                        newLayer.resetStyle = function (layer) {
                            layer.setStyle(getMarkerStyle(layer.feature));
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
                    newLayer.addTo(layerGroup);
                    mapFitBounds();

                    function generatePcodeValueMap(data) {
                        var pCodeValueMap = {};
                        var pCodeInfoMap = {};
                        var pcodeIndex, valueIndex;
                        var hxlRow = data[1];
                        for (var i = 0; i < hxlRow.length; i++) {
                            if (hxlRow[i] == firstLayer.joinColumn) {
                                pcodeIndex = i;
                            }
                            if (hxlRow[i] == firstLayer.valueColumn) {
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

                    function onLayerClick(e) {
                        if (currentLayer) {
                            newLayer.resetStyle(currentLayer);
                        }
                        var layer = e.target;
                        currentLayer = layer;
                        var newStyle = $.extend(getStyle(layer.feature), {
                            weight: 6,
                            opacity: 1,
                            color: "red"
                        });
                        layer.setStyle(newStyle);

                        $scope.$broadcast("layerSelect", [
                            {
                                "type": "select",
                                "options": {
                                    "column": mapData.layers[0].joinColumn,
                                    "operator": "=",
                                    "value": layer.feature.properties[mapData.shapefile.joinColumn]
                                }
                            }
                        ]);

                        if (isTouch) {
                            //show tooltip on click for touch devices
                            onLayerMouseMove(e);
                        }
                    }

                    function onLayerMouseMove(e) {
                        var layer = e.target;
                        popup.setLatLng(e.latlng);
                        var infoList;
                        if (layer.infoList) {
                            // in case it is a point layer we get the infoList from the layer
                            infoList = layer.infoList;
                        }
                        else {
                            var pcode = layer.feature.properties[mapData.shapefile.joinColumn];
                            infoList = values.infoMap[pcode];
                        }

                        //popup.setContent("<div><strong>" + pcode + "</strong>: " + values.map[pcode] + "</div>");
                        var content = '<div class="map-info-popup">';
                        $.each(infoList, function (idx, elem) {
                            content += '<strong>' + elem.tag + '</strong>: ' + elem.value + '<br />';
                        });
                        content += '</div>';
                        popup.setContent(content);

                        if (!popup._map) {
                            popup.openOn(map);
                        }
                        window.clearTimeout(closeTooltip);
                        $('.map-info-popup').mouseover(function (e) {
                            window.clearTimeout(closeTooltip);
                        });
                        $('.map-info-popup').mouseout(function (e) {
                            onLayerMouseOut(e);
                        });

                        //if (!L.Browser.ie && !L.Browser.opera) {
                        //    layer.bringToFront();
                        //}
                    }

                    function onLayerMouseOut(e) {
                        console.log("closing");
                        closeTooltip = window.setTimeout(function () {
                            $scope.map.closePopup();
                        }, 350);
                    }

                    function onEachFeature(feature, layer) {

                        layer.on({
                            mousemove: onLayerMouseMove,
                            mouseout: onLayerMouseOut,
                            click: onLayerClick

                        });
                    }

                    function getThresholdIndex(pcode) {
                        var value = values.map[pcode];
                        if (!value) {
                            return -1;
                        }

                        for (var i = 0; i < stepCount; i++) {
                            if (value < threshold[i]) {
                                return i;
                            }
                        }
                        return colors.length - 1;
                    }

                    function getColor(pcode) {
                        var idx = getThresholdIndex(pcode);
                        //console.log(pcode);
                        if (idx == -1) {
                            return "rgba(0,0,0,0)";
                        } else {
                            return colors[idx];
                        }
                    }

                    function getStyle(feature) {
                        return {
                            weight: 2,
                            opacity: 0.2,
                            color: '#ffffff',
                            fillOpacity: 0.7,
                            fillColor: getColor(feature.properties[mapData.shapefile.joinColumn])
                        };
                    }

                }, function (err) {
                    console.error(err);
                }
            );
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

        function initTouch() {
            //swipe events for charts on touch devices
            var charts = document.getElementById('charts');
            var chartW = $('.chart-item').outerWidth();
            var chartNum = $('#charts .chart-item').length;
            var chartID = 1;
            var hammer = new Hammer(charts);
            hammer.on('swipeleft swiperight', function (ev) {
                if ($(charts).width() > $('body').width()) {
                    if (ev.type == 'swipeleft' && chartID < chartNum) {
                        //swipe to the next chart
                        $('#charts').animate({left: '-=' + (chartW + 10) + 'px'});
                        chartID++;
                    }
                    if (ev.type == 'swiperight' && chartID > 1) {
                        //swipe to previous chart
                        $('#charts').animate({left: '+=' + (chartW + 10) + 'px'});
                        chartID--;
                    }
                }
            });
        }

    });
}(angular.module("hdx.map.explorer.home")));