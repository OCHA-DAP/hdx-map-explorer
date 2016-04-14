(function(module) {
    module.directive("layerLegend", function(DataFetcher, $timeout){
        return {
            restrict: "E",
            scope: {
                id: '=',
                map: '=',
                addAction: '=',
                removeAction: '=',
                initialSlice: '='
            },
            link: function($scope, element, attrs, controller){
                var map = $scope.map;

                $scope.legends = {};

                L.Control.Picker = L.Control.extend({
                    options: {
                        collapsed: true,
                        position: "topright"
                    },
                    onAdd: function(map){
                        var controlDiv = L.DomUtil.create('div', 'layer-legend-toggle leaflet-control-layers ');
                        var icon = L.DomUtil.create("i", "glyphicon glyphicon-menu-hamburger", controlDiv);
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
                    legends[data.type] = data;
                    $scope.legends = legends;
                });

                $scope.selectSlice = function(item){
                    $scope.$emit("addSlice", {url: item.url});
                    $scope.selection = undefined;
                };

                $scope.removeSlice = function(type){
                    $scope.$emit("removeSlice", type);
                    var legends = $scope.legends;
                    delete legends[type];
                    $scope.legends = legends;
                };

            },
            controller: function ($scope){
                DataFetcher.loadDatasets()
                    .then(function(result){
                        var data = $scope.data = result.data;

                        if ($scope.initialSlice){
                            var item;
                            for (var i = 0; i < data.length; i++){
                                item = data[i];
                                if (item.id == $scope.initialSlice){
                                    break;
                                }
                            }
                            $timeout(function(){
                                if (item != null){
                                    $scope.selectSlice(item);
                                }
                            }, 200);
                        }
                    });
            },
            templateUrl: "home/legend.tpl.html"
        };
    });
}(angular.module("hdx.map.explorer.home")));