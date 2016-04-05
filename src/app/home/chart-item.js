(function(module) {
    module.directive("chartItem", function(DataFetcher){
        return {
            restrict: "E",
            scope: {
                id: '=',
                data: '=',
                url: '='
            },
            link: function($scope, element, attrs, controller){
                if ($scope.data) {
                    var groupings = $scope.data.groupings;
                    var operationsInfo;
                    $scope.hasGroupings = groupings && groupings.length > 0 ? true : false;
                    if ( $scope.hasGroupings) {
                        $scope.selectedGrouping = operationsInfo = groupings[0];
                        $scope.groupings = groupings;
                    }
                    else {
                        operationsInfo = $scope.data;
                    }
                    var promise = DataFetcher.fetchData($scope.url, operationsInfo);
                    promise.then(function (result) {
                        var data = result.data;
                        var chartId = '#' + $scope.id;
                        var options = $.extend(true, $scope.data.options, {
                            bindto: chartId,
                            data: {
                                rows: data.slice(1)
                            }
                        });

                        $scope.chart = c3.generate(options);
                    }, dataError);
                }

                function changeChartData (url, operationsInfo, additionalFilters) {
                    var chart = $scope.chart;
                    DataFetcher.fetchData(url, operationsInfo, additionalFilters).then(function (result) {
                            var data = result.data;
                            if (data.length <= 2) {
                                chart.unload();
                            } else {
                                chart.load({
                                    rows: data.slice(1)
                                });
                            }

                        });
                }

                $scope.onChangeGroupings = function (index) {
                    $scope.selectedGrouping = operationsInfo = groupings[index];
                    changeChartData($scope.url, operationsInfo);

                };

                $scope.$on("layerSelect", function(event, data){
                    if ($scope.chart){
                        changeChartData($scope.url, operationsInfo, data);
                    }
                });
            },
            templateUrl: "home/chart-item.tpl.html"
        };
    });

    function dataError(error) {
        console.error(error);
    }
}(angular.module("hdx.map.explorer.home")));