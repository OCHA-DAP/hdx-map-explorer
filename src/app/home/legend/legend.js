(function(module) {
    module.directive("layerLegend", function(DataFetcher, $timeout, LayerTypes){
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
                $scope.layerTypes = [
                    {
                        name: "Shaded",
                        image: "assets/images/shaded.png",
                        type: LayerTypes.CHOROPLETH_TYPE
                    },
                    {
                        name: "Bubble",
                        image: "assets/images/bubble.png",
                        type: LayerTypes.BUBBLE_TYPE
                    },
                    {
                        name: "Point",
                        image: "assets/images/point.png",
                        type: LayerTypes.POINT_TYPE
                    },
                    {
                        name: "Heatmap",
                        image: "assets/images/heatmap.png",
                        type: null
                    }
                ];

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
                    legends[data.layerInfo.type] = data;
                    $scope.legends = legends;
                    data.hideSettingsIcon = data.layerInfo.type == LayerTypes.CHART_ONLY;
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

                $scope.changeType = function(type, newType){
                    if (type != newType){
                        $scope.removeSlice(newType);
                        var legends = $scope.legends;
                        delete legends[type];
                        $scope.legends = legends;
                        $scope.$emit("changeSlice", {
                            oldType: type,
                            newType: newType
                        });
                    }
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
            templateUrl: "home/legend/legend.tpl.html"
        };
    });
}(angular.module("hdx.map.explorer.home.legend")));