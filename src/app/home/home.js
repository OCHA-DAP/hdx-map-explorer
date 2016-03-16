(function(module) {
    module.controller('HomeController', function ($scope, $http, $q, DataFetcher) {
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
        var map, layerGroup = new L.LayerGroup(), popup = new L.Popup({ autoPan: false, offset: L.point(1, -6) }), closeTooltip;
        var chartData, mapData;

        init();

        function init() {
            loadData();
            buildBaseMap();
            $scope.toggleDataset = toggleDataset;
        }

        function toggleDataset(url){
            loadJson(url).then(
                function(data) {
                    buildMap(data.data);
                    buildChart(data.data);
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
            map = L.map("map").setView([51.505, -0.09], 7);
            baselayers.CartoDB_DarkMatter.addTo(map);
            L.control.layers(baselayers, null, {collapsed: true, position: "bottomleft"}).addTo(map);
            layerGroup.addTo(map);
        }

        function buildMap(data){
            mapData = data.map;
            layerGroup.clearLayers();
            //var paramList = buildUrlFilterList(mapData.layers[0].operations);
            //var promise1 = DataFetcher.getFilteredDataByParamList(data.url, paramList);
            var promise1 = fetchData(data.url, mapData.layers[0]);
            var promise2 = $http.get(mapData.shapefile.url);

            $q.all([promise1, promise2]).then(
                function(promiseValues){
                    var data = promiseValues[0].data,
                        geojson = promiseValues[1].data;

                    var values = generatePcodeValueMap(data);
                    var stepCount = 4;
                    var colors = ["rgb(215,25,28)", "rgb(253,174,97)", "rgb(255,255,191)", "rgb(171,221,164)", "rgb(43,131,186)"];
                    var step = (values.max - values.min) / stepCount;
                    var thresholds = [];
                    for (var sIdx = 0; sIdx < stepCount; sIdx++){
                        thresholds.push(values.min + sIdx*step);
                    }


                    var geoLayer = L.geoJson(geojson, {
                        style: getStyle,
                        onEachFeature: onEachFeature
                    });
                    geoLayer.addTo(layerGroup);
                    map.fitBounds(geoLayer.getBounds());

                    //map.legendControl.addLegend(getLegendHTML());

                    function getLegendHTML() {
                        var labels = [],
                            from, to;

                        for (var i = 0; i < thresholds.length; i++) {
                            from = thresholds[i];
                            to = thresholds[i + 1];

                            //labels.push(
                            //    '<li><span class="swatch" style="background:' + getColor(from + 1) + '"></span> ' +
                            //    from + (to ? '&ndash;' + to : '+')) + '</li>';
                        }

                        return '<span>People per square mile</span><ul>' + labels.join('') + '</ul>';
                    }
                    function generatePcodeValueMap(data){
                        var pCodeValueMap = {};
                        var pcodeIndex, valueIndex;
                        var hxlRow = data[1];
                        for (var i = 0; i < hxlRow.length; i++){
                            if (hxlRow[i] == mapData.layers[0].joinColumn){
                                pcodeIndex = i;
                            }
                            if (hxlRow[i] == mapData.layers[0].valueColumn){
                                valueIndex = i;
                            }
                        }

                        var min = null, max = null;
                        for (var j = 2; j < data.length; j++){
                            var value = data[j][valueIndex];
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
                            min: min,
                            max: max
                        };
                    }
                    function onEachFeature(feature, layer){
                        layer.on({
                            mousemove: function(e){
                                var layer = e.target;
                                popup.setLatLng(e.latlng);
                                var pcode = layer.feature.properties[mapData.shapefile.joinColumn];
                                popup.setContent("<div><strong>"+ pcode +"</strong>: "+ values.map[pcode] +"</div>");
                                if (!popup._map) {
                                    popup.openOn(map);
                                }
                                window.clearTimeout(closeTooltip);
                                if (!L.Browser.ie && !L.Browser.opera) {
                                    layer.bringToFront();
                                }
                            },
                            mouseout: function (e){
                                console.log("closing");
                                closeTooltip = window.setTimeout(function(){
                                    map.closePopup();
                                }, 100);
                            }
                        });
                    }
                    function getColor(pcode){
                        //console.log(pcode);
                        var value = values.map[pcode];
                        if (!value) {
                            return "rgba(0,0,0,0)";
                        }

                        for (var i = 0; i < stepCount; i++){
                            if (value < thresholds[i]){
                                return colors[i];
                            }
                        }
                        return colors[colors.length - 1];
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

        function fetchData(url, data, additionalFilters){
            var operations = data.operations;
            var paramList = buildUrlFilterList(operations);
            if (additionalFilters && additionalFilters.length > 0) {
                operations = operations.slice(0);
                var currentIndex = data.nextIndex;
                for (var i=0; i<additionalFilters.length; i++){
                    var filter = additionalFilters[0];
                    var param = DataFetcher.buildNewParam(filter.key, filter.value, currentIndex);
                    currentIndex++;
                    paramList.push(param);
                }
            }
            var promise = DataFetcher.getFilteredDataByParamList(url, paramList);
            return promise;
        }

        function buildChart(data) {
            chartData = data.charts[0];
            //var paramList = buildUrlFilterList(chartData.operations);
            //var promise = DataFetcher.getFilteredDataByParamList(data.url, paramList);

            //var promise = fetchData(data.url, chartData, [{key:'#country+name', value: 'Chad'}]);
            var promise = fetchData(data.url, chartData);
            promise.then(
                function(result){
                    var data = result.data;
                    var limitedData = [];
                    for (var i = 1; i < data.length; i++){
                        limitedData.push(data[i]);
                    }
                    var options = $.extend(true, chartData.options, {
                        bindto: "#zaChart",
                        data: {
                            rows: limitedData
                        }
                    });

                    var chart = c3.generate(options);
                },
                function (error){
                    console.error(error);
                }
            );
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

    });
}(angular.module("hdx.map.explorer.home")));