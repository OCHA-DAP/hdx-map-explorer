(function(module) {
    module.controller('HomeController', function ($scope, $http, $q, DataFetcher, FilterBuilder) {
        var model = this;
        var baselayers = {
            OpenStreetMap_BlackAndWhite: L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }),
            OpenStreetMap_HOT: L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
            }),
            Thunderforest_TransportDark: L.tileLayer('http://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19
            }),
            Thunderforest_Landscape: L.tileLayer('http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }),
            OpenMapSurfer_Grayscale: L.tileLayer('http://korona.geog.uni-heidelberg.de/tiles/roadsg/x={x}&y={y}&z={z}', {
                maxZoom: 19,
                attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }),
            CartoDB_Positron: L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }),
            CartoDB_DarkMatter: L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
                subdomains: 'abcd',
                maxZoom: 19
            })
        };
        var map, layerGroup = new L.LayerGroup(), popup = new L.Popup({ autoPan: false, offset: L.point(1, -6) }),
            closeTooltip, currentLayer, mainLayer;
        var chart, chartData, mapData, dataUrl;
        var isTouch;

        init();

        function init() {
            loadData();
            buildBaseMap();
            $scope.toggleDataset = toggleDataset;

            //detect touch device
            isTouch = 'ontouchstart' in document.documentElement;
            if (isTouch) {
                initTouch();
            }
        }

        function toggleDataset(url){
            loadJson(url).then(
                function(data) {
                    buildMap(data.data);
                    buildChart(data.data);
                    dataUrl = data.data.url;
                }
            );
        }
        function loadData(){
            model.datasets = [];
            $http.get('/assets/datasets.json')
                .then(
                    function(result){
                        model.datasets = result.data;
                    }
                );
        }

        function loadJson(url) {
            return $http.get(url);
        }

        function buildBaseMap(){
            map = L.map("map", { zoomControl:false }).setView([51.505, -0.09], 7);
            map.on("resize", function(){
                mapFitBounds();
            });
            baselayers.CartoDB_DarkMatter.addTo(map);
            L.control.layers(baselayers, null, {collapsed: true, position: "topleft"}).addTo(map);
            layerGroup.addTo(map);
        }

        function buildMap(data){
            mapData = data.map;
            layerGroup.clearLayers();
            //var paramList = buildUrlFilterList(mapData.layers[0].operations);
            //var promise1 = DataFetcher.getFilteredDataByParamList(data.url, paramList);
            var promise1 = fetchData(data.url, mapData.layers[0]);
            var promise2 = {};
            if (mapData.shapefile) {
                promise2 = $http.get(mapData.shapefile.url);
            }

            $q.all([promise1, promise2]).then(
                function(promiseValues){
                    var data = promiseValues[0].data,
                        geojson = promiseValues[1].data;
                    var onlyLayer = mapData.layers[0];
                    var values = generatePcodeValueMap(data);
                    var stepCount = 10;
                    var colors = onlyLayer.colors;
                    var step = (values.max - values.min) / stepCount;
                    var threshold = onlyLayer.threshold;
                    if (!threshold){
                        threshold = [];
                        for (var sIdx = 0; sIdx < stepCount; sIdx++){
                            threshold.push(values.min + sIdx*step);
                        }
                    }
                    function getPointStyle(value) {
                        var thresholdIndex, fillColor;
                        for (var i = 0; i < stepCount; i++){
                            if (value < threshold[i]){
                                thresholdIndex = i;
                                break;
                            }
                        }
                        var weight = (thresholdIndex == -1)? 0 : 2;
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
                        var weight = (thresholdIndex == -1)? 0 : 2;
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
                    if (onlyLayer.type == "choropleth"){
                        mainLayer = L.geoJson(geojson, {
                            style: getStyle,
                            onEachFeature: onEachFeature
                        });
                    }
                    else if (onlyLayer.type == 'point') {
                        var points = [];
                        var clusterGroup = L.markerClusterGroup({spiderfyDistanceMultiplier: 1.3});
                        var latIndex, longIndex;
                        for (var i=0; i<data[1].length; i++) {
                            if (data[1][i] == mapData.layers[0].latColumn){
                                latIndex = i;
                            }
                            else if (data[1][i] == mapData.layers[0].longColumn){
                                longIndex = i;
                            }
                        }

                        $.each(data, function(idx, dataLine) {
                            if (idx > 1) {
                                var lat = dataLine[latIndex], long = dataLine[longIndex];
                                var marker = L.circleMarker(L.latLng(lat, long), getPointStyle(dataLine[20]));

                                var infoList = [];
                                for (var i=0; i<dataLine.length; i++){
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
                        mainLayer = clusterGroup;
                        //mainLayer = L.featureGroup(points);
                    }
                    else {
                        var markers = [];
                        $.each(geojson.features, function(idx, geo){
                            var poly = L.geoJson(geo);
                            var pcode = geo.properties[mapData.shapefile.joinColumn];
                            if (getThresholdIndex(pcode) > -1){
                                var marker = L.circleMarker(poly.getBounds().getCenter(), getMarkerStyle(geo));

                                markers.push(marker);
                                marker.feature = geo;
                                marker.on("click", onLayerClick);
                                marker.on("mousemove", onLayerMouseMove);
                                marker.on("mouseout", onLayerMouseOut);
                                //marker.addTo(map);
                            }
                        });
                        mainLayer = L.featureGroup(markers);
                        mainLayer.resetStyle = function(layer){
                            layer.setStyle(getMarkerStyle(layer.feature));
                        };
                    }
                    mainLayer.addTo(layerGroup);
                    mapFitBounds();
                    //map.fitBounds(mainLayer.getBounds());

                    //var legend = L.control({ position: "topleft" });
                    //legend.onAdd = function(map){
                    //    this._div = getLegendHTML();
                    //    return this._div;
                    //};
                    //legend.addTo(map);

                    function getLegendHTML() {
                        var labels = [],
                            from, to;

                        for (var i = 0; i < threshold.length; i++) {
                            from = threshold[i];
                            to = threshold[i + 1];

                            //labels.push(
                            //    '<li><span class="swatch" style="background:' + getColor(from + 1) + '"></span> ' +
                            //    from + (to ? '&ndash;' + to : '+')) + '</li>';
                        }

                        return '<span>People per square mile</span><ul>' + labels.join('') + '</ul>';
                    }
                    function generatePcodeValueMap(data){
                        var pCodeValueMap = {};
                        var pCodeInfoMap = {};
                        var pcodeIndex, valueIndex;
                        var hxlRow = data[1];
                        for (var i = 0; i < hxlRow.length; i++){
                            if (hxlRow[i] == onlyLayer.joinColumn){
                                pcodeIndex = i;
                            }
                            if (hxlRow[i] == onlyLayer.valueColumn){
                                valueIndex = i;
                            }
                        }

                        var min = null, max = null;
                        for (var j = 2; j < data.length; j++){
                            var value = data[j][valueIndex];
                            var infoList = [];
                            for (var k=0; k< data[j].length; k++){
                                infoList.push({'tag': hxlRow[k], 'value': data[j][k]});
                            }
                            pCodeInfoMap[data[j][pcodeIndex]] = infoList;
                            pCodeValueMap[data[j][pcodeIndex]] = value;

                            if (min == null || min > value){
                                min = value;
                            }
                            if (max == null || max < value){
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
                            mainLayer.resetStyle(currentLayer);
                        }
                        var layer = e.target;
                        currentLayer = layer;
                        var newStyle = $.extend(getStyle(layer.feature), {
                            weight: 6,
                            opacity: 1,
                            color: "red"
                        });
                        layer.setStyle(newStyle);

                        fetchData(dataUrl, chartData, [
                            {
                                "type": "select",
                                "options": {
                                    "column": mapData.layers[0].joinColumn,
                                    "operator": "=",
                                    "value": layer.feature.properties[mapData.shapefile.joinColumn]
                                }
                            }
                        ])
                            .then(function (result) {
                                chart.prepareRerender();
                                var data = result.data;
                                if (data.length <= 2) {
                                    chart.unload();
                                } else {
                                    chart.load({
                                        rows: data.slice(1)
                                    });
                                }

                            });


                        if (isTouch){
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
                        else{
                            var pcode = layer.feature.properties[mapData.shapefile.joinColumn];
                            infoList = values.infoMap[pcode];
                        }

                        //popup.setContent("<div><strong>" + pcode + "</strong>: " + values.map[pcode] + "</div>");
                        var content = '<div class="map-info-popup">';
                        $.each(infoList, function(idx, elem){
                            content += '<strong>' + elem.tag + '</strong>: ' + elem.value + '<br />';
                        });
                        content += '</div>';
                        popup.setContent(content);

                        if (!popup._map) {
                            popup.openOn(map);
                        }
                        window.clearTimeout(closeTooltip);
                        $('.map-info-popup').mouseover(function(e){
                            window.clearTimeout(closeTooltip);
                        });
                        $('.map-info-popup').mouseout(function(e){
                            onLayerMouseOut(e);
                        });

                        //if (!L.Browser.ie && !L.Browser.opera) {
                        //    layer.bringToFront();
                        //}
                    }
                    function onLayerMouseOut(e) {
                        console.log("closing");
                        closeTooltip = window.setTimeout(function () {
                            map.closePopup();
                        }, 350);
                    }
                    function onEachFeature(feature, layer){

                        layer.on({
                            mousemove: onLayerMouseMove,
                            mouseout: onLayerMouseOut,
                            click: onLayerClick

                        });
                    }
                    function getThresholdIndex(pcode){
                        var value = values.map[pcode];
                        if (!value) {
                            return -1;
                        }

                        for (var i = 0; i < stepCount; i++){
                            if (value < threshold[i]){
                                return i;
                            }
                        }
                        return colors.length - 1;
                    }
                    function getColor(pcode){
                        var idx = getThresholdIndex(pcode);
                        //console.log(pcode);
                        if (idx == -1){
                            return "rgba(0,0,0,0)";
                        } else {
                            return colors[idx];
                        }
                    }
                    function getStyle(feature){
                        return {
                            weight: 2,
                            opacity: 0.2,
                            color: '#ffffff',
                            fillOpacity: 0.7,
                            fillColor: getColor(feature.properties[mapData.shapefile.joinColumn])
                        };
                    }

                }, function (err){
                    console.error(err);
                }
            );
        }
        function mapFitBounds(){
            var padding = [0,0];
            if (map._container){
                if (map._container.clientWidth > map._container.clientHeight){
                    padding = [Math.floor(map._container.clientWidth*0.25), 0];
                } else {
                    padding = [0, Math.floor(map._container.clientHeight*0.25)];
                }
            }
            map.fitBounds(mainLayer.getBounds(), {paddingBottomRight: padding});
        }
        function fetchData(url, data, additionalFilters){
            var operations = data.operations;
            if (additionalFilters && additionalFilters.length > 0) {
                operations = additionalFilters.concat(operations);
            }
            var paramString = FilterBuilder.buildFilter(operations);
            var promise = DataFetcher.getFilteredData(url, paramString);
            return promise;
        }

        function buildChart(data) {
            if (data.charts) {
                chartData = data.charts[0];
                //var paramList = buildUrlFilterList(chartData.operations);
                //var promise = DataFetcher.getFilteredDataByParamList(data.url, paramList);

                //var promise = fetchData(data.url, chartData, [{key:'#country+name', value: 'Chad'}]);
                var promise = fetchData(data.url, chartData);
                promise.then(
                    function (result) {
                        var data = result.data;
                        var limitedData = [];
                        for (var i = 1; i < data.length; i++) {
                            limitedData.push(data[i]);
                        }
                        var options = $.extend(true, chartData.options, {
                            bindto: "#zaChart",
                            data: {
                                rows: limitedData
                            },
                            onresize: function () {
                                chart.prepareRerender();
                            },
                            onrendered: function () {
                                $("#zaChart").parent().addClass("rendered");
                            }
                        });

                        $("#zaChart").parent().removeClass("rendered");
                        chart = c3.generate(options);
                        chart.prepareRerender = function () {
                            $("#zaChart").parent().removeClass("rendered");
                        };
                    },
                    function (error) {
                        console.error(error);
                    }
                );
            }
        }

        function buildUrlFilterList(operations) {
            var params = [];
            if ( operations ) {
                for (var i=0; i<operations.length; i++) {
                    var op = operations[i];
                    if (op.type == 'url-params') {
                        params.push(op.options.value);
                    }
                }
            }
            return params;
        }

        function initTouch() {
            //swipe events for charts on touch devices
            var charts = document.getElementById('charts');
            var chartW = $('.chart-item').outerWidth();
            var chartNum = $('#charts .chart-item').length;
            var chartID = 1;
            var hammer = new Hammer(charts);
            hammer.on('swipeleft swiperight', function(ev) {
                if ($(charts).width() > $('body').width()) {
                    if (ev.type == 'swipeleft' && chartID < chartNum) {
                        //swipe to the next chart
                        $('#charts').animate({left: '-='+ (chartW+10) +'px'}); 
                        chartID++;   
                    }
                    if (ev.type == 'swiperight' && chartID > 1) {
                        //swipe to previous chart
                        $('#charts').animate({left: '+='+ (chartW+10) +'px'}); 
                        chartID--;   
                    }
                }
            });
        }

    });
}(angular.module("hdx.map.explorer.home")));