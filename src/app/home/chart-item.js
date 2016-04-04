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
                    var chartData = $scope.data;
                    var promise = DataFetcher.fetchData($scope.url, chartData);
                    promise.then(function (result) {
                        var data = result.data;
                        var limitedData = [];
                        for (var i = 1; i < data.length; i++) {
                            limitedData.push(data[i]);
                        }
                        var chartId = '#' + $scope.id;
                        var options = $.extend(true, chartData.options, {
                            bindto: chartId,
                            data: {
                                rows: limitedData
                            },
                            onresize: function () {
                                $(chartId).parent().removeClass("rendered");
                            },
                            onrendered: function () {
                                $(chartId).parent().addClass("rendered");
                            }
                        });

                        $(chartId).parent().removeClass("rendered");
                        c3.generate(options);
                    }, dataError);
                }
            },
            templateUrl: "home/chart-item.tpl.html"
        };
    });

    function dataError(error) {
        console.error(error);
    }
}(angular.module("hdx.map.explorer.home")));