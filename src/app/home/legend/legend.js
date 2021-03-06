(function(module) {
    module.directive("layerLegend", function(DataFetcher, $timeout, LayerTypes){
        return {
            restrict: "E",
            scope: {
                id: '=',
                title: "=",
                map: '=',
                addAction: '=',
                removeAction: '=',
                initialSlice: '=',
                crisisName: "="
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
                        var icon = L.DomUtil.create("i", "glyphicon glyphicon-remove", controlDiv);
                        L.DomEvent
                            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
                            .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
                            .addListener(controlDiv, 'click', function() {
                                $(icon).toggleClass("glyphicon-menu-hamburger");
                                $(icon).toggleClass("glyphicon-remove");
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

                $scope.resetAll = function(){

                    for (var type in $scope.legends){
                        $scope.resetSlice(type);
                    }
                };

                $scope.resetSlice = function(type){
                    $scope.$emit("resetSlice", type);
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

                $scope.layerTypeName = function(type){
                    for (var idx in $scope.layerTypes){
                        var lt = $scope.layerTypes[idx];
                        if (lt.type == type){
                            return lt.name;
                        }
                    }
                    return type;
                };

            },
            controller: function ($scope){
                var loadDatasets = function(crisisName) {
                    if (crisisName) {
                        DataFetcher.loadDatasets(crisisName)
                            .then(function (result) {
                                $scope.title = result.data.title;

                                var data = $scope.data = result.data.layers;
                                if ($scope.initialSlice) {
                                    var item;
                                    for (var i = 0; i < data.length; i++) {
                                        item = data[i];
                                        if (item.id == $scope.initialSlice) {
                                            break;
                                        }
                                    }
                                    $timeout(function () {
                                        if (item != null) {
                                            $scope.selectSlice(item);
                                        }
                                    }, 200);
                                }

                                if ($scope.map){
                                    var DEFAULT_LAT = 10, DEFAULT_LONG = 10, DEFAULT_ZOOM = 5;
                                    if (!result.data.mapCenter){
                                        $scope.map.setView([DEFAULT_LAT, DEFAULT_LONG], DEFAULT_ZOOM);
                                    } else {
                                        var lat = result.data.mapCenter.lat || DEFAULT_LAT;
                                        var long = result.data.mapCenter.long || DEFAULT_LONG;
                                        var zoom = result.data.mapCenter.zoom || DEFAULT_ZOOM;
                                        $scope.map.setView([lat, long], zoom);
                                    }
                                }
                            });
                    }
                };
                loadDatasets($scope.crisisName);
                $scope.$watch("crisisName", loadDatasets);
            },
            templateUrl: "home/legend/legend.tpl.html"
        };
    });
}(angular.module("hdx.map.explorer.home.legend")));