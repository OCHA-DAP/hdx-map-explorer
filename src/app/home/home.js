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

        init();

        function init() {

            loadJson('/assets/idps.json').then(
                function(data) {
                    buildMap(data.data);
                    buildChart(data.data);
                }
            );

            //var hxlPromise = DataFetcher.getData('http://popstats.unhcr.org/en/demographics.hxl', '#country+residence', 'Slovenia');
            //hxlPromise.then(
            //  function(data) {
            //      model.result = data;
            //  }
            //);


        }

        function loadJson(url) {
            return $http.get(url);
        }

        function buildMap(data){
            var mapData = data.map;
            var paramList = buildUrlFilterList(mapData.layers[0].operations);
            var promise1 = DataFetcher.getFilteredDataByParamList(data.url, paramList);
            var promise2 = $http.get(mapData.shapefile.url);


            var map = L.map("map").setView([51.505, -0.09], 7);
            baselayers.CartoDB_DarkMatter.addTo(map);
            L.control.layers(baselayers, null, {collapsed: true, position: "bottomleft"}).addTo(map);
            console.log("done");

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
                    geoLayer.addTo(map);
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
                        //interactivity
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

        function buildChart(data) {
            var chartData = data.charts[0];
            var paramList = buildUrlFilterList(chartData.operations);
            var promise = DataFetcher.getFilteredDataByParamList(data.url, paramList);
            promise.then(
                function(data){
                    var chart = c3.generate({
                        bindto: "#zaChart",
                        data: {
                            rows: [

                            ],
                            type: 'bar'
                        }
                    });
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