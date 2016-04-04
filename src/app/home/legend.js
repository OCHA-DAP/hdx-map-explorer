(function(module) {
    module.directive("layerLegend", function(DataFetcher){
        return {
            restrict: "E",
            scope: {
                id: '=',
                map: '=',
                addAction: '=',
                removeAction: '='
            },
            link: function($scope, element, attrs, controller){
                var map = $scope.map;

                $scope.legends = [];

                L.Control.Picker = L.Control.extend({
                    options: {
                        collapsed: true,
                        position: "topright",
                    },
                    onAdd: function(map){
                        var controlDiv = L.DomUtil.create('div', 'layer-legend-toggle leaflet-control-layers ');
                        var icon = L.DomUtil.create("i", "glyphicon glyphicon-align-center", controlDiv);
                        L.DomEvent
                            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
                            .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
                            .addListener(controlDiv, 'click', function() {
                                $(element).toggle(100);
                            });
                        return controlDiv;
                    }
                });
                map.addControl(new L.Control.Picker());

                $scope.$on("sliceCreated", function(event, data){
                    var legends = $scope.legends;
                    legends.push(data);
                    $scope.legends = legends;
                });

                $scope.selectSlice = function(url){
                    $scope.$emit("addSlice", {url: url});
                };

                DataFetcher.loadDatasets()
                    .then(function(result){
                        $scope.data = result.data;
                    });
            },
            templateUrl: "home/legend.tpl.html"
        };
    });
}(angular.module("hdx.map.explorer.home")));