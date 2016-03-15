(function(module) {
    module.controller('HomeController', function ($scope, $http, DataFetcher) {
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

            loadJson('/assets/config-template.json').then(
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
            var promise = DataFetcher.getFilteredDataByParamList(data.url, paramList);

            var map = L.map("map").setView([51.505, -0.09], 7);
            baselayers.CartoDB_DarkMatter.addTo(map);
            L.control.layers(baselayers, null, {collapsed: false}).addTo(map);
            console.log("done");

        }

        function buildChart(data) {
            buildUrlFilterList(data[0].operations);
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