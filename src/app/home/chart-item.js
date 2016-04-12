(function(module) {
    module.directive("chartItem", function($q, DataFetcher){
        return {
            restrict: "E",
            scope: {
                chartId: '=',
                data: '=',
                url: '=',
                type: '='
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
                        var usableData = result.data.slice(1);
                        var chartId = '#' + $scope.chartId;
                        var options = $.extend(true, $scope.selectedChart.options, {
                            bindto: chartId,
                            data: {
                                rows: usableData,
                                onclick: function (d, element) {
                                    var additionalFilters = [
                                        {
                                            'type': 'select',
                                            'options': {
                                                'column': chartData.options.data.x,
                                                'operator': '=',
                                                'value': usableData[d.index + 1][0]
                                            }
                                        }
                                    ];
                                    $scope.$emit("chartPointClicked", additionalFilters);
                                }
                            },
                            onresized: function () {
                                $scope.chart.destroy();
                                $(chartId).removeAttr( 'style' );
                                setTimeout(function(){$scope.chart = c3.generate(options);}, 200);
                                // $scope.chart = c3.generate(options);
                            }
                        });

                        $scope.chart = c3.generate(options);
                    }, dataError);

                }

                function changeChartData (url, chartData, additionalFilters) {
                    var deferred = $q.defer();
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
                            deferred.resolve(additionalFilters);
                        });

                    return deferred.promise;
                }

                $scope.onChangeCharts = function (index) {
                    $scope.selectedChart = charts[index];
                    createChart($scope.url, $scope.selectedChart);

                };

                $scope.$on("layerSelect", function(event, data){
                    if ($scope.chart){
                        changeChartData($scope.url, $scope.selectedChart, data).then(function(additionalFilters) {
                            var appliedFilters = "";
                            angular.forEach(additionalFilters, function (item) {
                                console.log(JSON.stringify(item));
                                appliedFilters += item.options.value + ",";
                            });
                            $scope.appliedFilters = appliedFilters.substring(0, appliedFilters.length - 1);
                        });
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