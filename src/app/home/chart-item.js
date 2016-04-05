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
                    var promise = DataFetcher.fetchData($scope.url, $scope.data);
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

                $scope.$on("layerSelect", function(event, data){
                    if ($scope.chart){
                        DataFetcher.fetchData($scope.url, $scope.data, data)
                            .then(function (result) {
                                var data = result.data;
                                if (data.length <= 2) {
                                    $scope.chart.unload();
                                } else {
                                    $scope.chart.load({
                                        rows: data.slice(1)
                                    });
                                }
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