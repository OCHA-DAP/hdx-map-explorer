(function(module) {
    module.controller('HomeController', function ($scope) {
        var model = this;

        init();

        function init() {
            buildMap();

        }

        function buildMap(){
            var map = L.map("map").setView([51.505, -0.09], 7);
            L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);
            console.log("done");
        }

    });
}(angular.module("hdx.map.explorer.home")));