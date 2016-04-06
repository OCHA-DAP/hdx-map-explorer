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
                var charts = $scope.data;
                if (charts.length > 0) {
                    $scope.hasMoreCharts = charts.length > 1;
                    $scope.selectedChart = charts[0];
                    createChart($scope.url, $scope.selectedChart);
                }

                function createChart(url, chartData) {
                    $scope.appliedFilters = "";
                    if ($scope.chart) {
                        $scope.chart.destroy();
                    }
                    var promise = DataFetcher.fetchData(url, chartData);
                    promise.then(function (result) {
                        var data = result.data;
                        var chartId = '#' + $scope.id;
                        var options = $.extend(true, $scope.selectedChart.options, {
                            bindto: chartId,
                            data: {
                                rows: data.slice(1)
                            }
                        });

                        $scope.chart = c3.generate(options);
                    }, dataError);

                }

                function changeChartData (url, chartData, additionalFilters) {
                    var chart = $scope.chart;
                    DataFetcher.fetchData(url, chartData, additionalFilters).then(function (result) {
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

                $scope.onChangeCharts = function (index) {
                    $scope.selectedChart = charts[index];
                    createChart($scope.url, $scope.selectedChart);

                };

                $scope.$on("layerSelect", function(event, data){
                    if ($scope.chart){
                        var appliedFilters = "";
                        angular.forEach(data, function(item){console.log(JSON.stringify(item));appliedFilters += item.options.value + ",";});
                        $scope.appliedFilters = appliedFilters.substring(0, appliedFilters.length-1);
                        changeChartData($scope.url, $scope.selectedChart, data);
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