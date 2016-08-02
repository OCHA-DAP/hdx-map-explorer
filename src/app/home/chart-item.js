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
                var options = null;
                var chartUrl = $scope.url;
                var charts = $scope.data.charts;
                var chartId = '#' + $scope.chartId;
                var chartWrapperClass = $scope.chartWrapperClass = "chart-item-wrapper";
                if (charts.length > 0) {
                    $scope.hasMoreCharts = charts.length > 1;
                    $scope.selectedChart = charts[0];
                    createChart($scope.url, $scope.selectedChart, $scope.data.selections.layerSelection)
                        .then(generateAppliedFiltersString);
                }

                function createChart(url, chartData, additionalFilters) {
                    var deferred = $q.defer();
                    console.log("Dimensions for " + chartId + " are - W " + $(chartId).width() + ", H " + $(chartId).height());
                    var chartWrapperEls = $("#" + chartWrapperClass);
                    var chartSize = null;

                    if (chartWrapperEls.length > 0 && chartWrapperEls[0].id != $scope.chartId ) {
                        //sizing controlled by css
                        // chartSize = {
                        //     width: $(chartWrapperEls[0]).width(),
                        //     height: $(chartWrapperEls[0]).height()
                        // };
                        console.log(" using size " + JSON.stringify(chartSize) + " for item " + chartId);
                    }
                    $scope.appliedFilters = "";
                    if ($scope.chart) {
                        $scope.chart.destroy();
                    }
                    var promise = DataFetcher.fetchData(url, chartData, additionalFilters);
                    promise.then(function (result) {
                        var usableData = result.data.slice(1);
                        var tickObject = chartData.options.axis.x.tick;
                        options = $.extend(true, {}, $scope.selectedChart.options, {
                            bindto: chartId,
                            axis: {
                                x: {
                                    tick: {
                                        rotate: tickObject != null && tickObject.rotate!=null ? tickObject.rotate : 30,
                                        multiline: tickObject != null && tickObject.multiline!=null ? tickObject.multiline : false
                                    }
                                },
                                y: {
                                    tick: {
                                        values: decideChartValues(usableData, chartData.options.data.y, 4),
                                        format: _abbrNum
                                    }
                                }

                            },
                            padding: {
                                left: 55,
                                right: 20
                            },
                            size: chartSize,
                            color: {
                                pattern: [decideChartColor($scope.data.colors)]
                            },
                            data: {
                                rows: usableData,
                                x: chartData.options.data.x,
                                y: chartData.options.data.y,
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

                                    var data = {
                                        filters: additionalFilters,
                                        type: $scope.type
                                    };
                                    $scope.$emit("chartPointClicked", data);
                                }
                            },
                            grid: {
                                y: {
                                    lines: [{value: 0}]
                                }
                            }
                            // onresized: function () {
                            //     $scope.chart.destroy();
                            //     $(chartId).removeAttr( 'style' );
                            //     setTimeout(function(){
                            //         // console.log("resized - Dimensions for " + chartId + " are - W " + $(chartId).width() + ", H " + $(chartId).height());
                            //         options.size = null;
                            //         $scope.chart = c3.generate(options);
                            //     }, 200);
                            // }
                        });
                        $scope.chart = c3.generate(options);
                        var cols = unloadColumns(options);
                        $scope.chart.unload(cols);
                        deferred.resolve(additionalFilters);
                    }, dataError);

                    return deferred.promise;

                }

                function changeChartData (url, chartData, additionalFilters) {
                    var deferred = $q.defer();
                    var chart = $scope.chart;
                    DataFetcher.fetchData(url, chartData, additionalFilters).then(function (result) {
                            var data = result.data;
                            if (data.length <= 2) {
                                chart.unload();
                            } else {
                                var usableData = data.slice(1);
                                options.data.rows = usableData;
                                var axis = options.axis;
                                axis.y.tick.values = decideChartValues(usableData, chartData.options.data.y, 4);
                                chart.load({
                                    rows: usableData,
                                    unload: true
                                });
                                chart.internal.loadConfig({axis: axis});
                            }
                            deferred.resolve(additionalFilters);
                        });

                    return deferred.promise;
                }

                function generateAppliedFiltersString(additionalFilters) {
                    var appliedFilters = "";
                    angular.forEach(additionalFilters, function (item) {
                        console.log(JSON.stringify(item));
                        appliedFilters += item.options.value + ",";
                    });
                    $scope.appliedFilters = appliedFilters.substring(0, appliedFilters.length - 1);
                }

                /**
                 * Called when a user selects another type of chart from the dropdown
                 * @param index shows which chart was selected by the user
                 */
                $scope.onChangeCharts = function (index) {
                    $scope.selectedChart = charts[index];
                    createChart($scope.url, $scope.selectedChart);
                    $scope.$emit("chartReplaced",{
                        type: $scope.type,
                        chartName: $scope.selectedChart.name
                    });

                };

                $scope.$on("windowResized", function (event, data) {
                    if ($scope.chart) {
                        $scope.chart = $scope.chart.destroy();
                    }
                    $(chartId).removeAttr('style');
                    setTimeout(function () {
                        console.log("resized - Dimensions for " + chartId + " are - W " + $(chartId).width() + ", H " + $(chartId).height());
                        options.size = null;
                        $scope.chart = c3.generate(options);
                    }, 200);
                });

                $scope.$on("layerSelect", function(event, data){
                    if ($scope.chart && (data.type == $scope.type)){
                        changeChartData(chartUrl, $scope.selectedChart, data.filters).then(generateAppliedFiltersString);
                    }
                });
            },
            templateUrl: "home/chart-item.tpl.html"
        };
    });

    function dataError(error) {
        console.error(error);
    }

    function decideChartColor(colorList) {
        if (colorList && colorList.length > 0) {
            var index = Math.floor(colorList.length / 2);
            return colorList[index];
        }
        else {
            return null;
        }
    }

    function unloadColumns(options) {
        //options.data.x|y options.rows[0]
        var result = [];
        var columns = options.data.rows[0];
        for (var i=0; i< columns.length; i++){
            if( !(columns[i] == options.data.x || columns[i] == options.data.y) ) {
                result.push(columns[i]);
            }
        }
        return result;
    }

    function _abbrNum(number) {
        //fixed decimal places
        var decPlacesNo = 2;
        // 2 decimal places => 100, 3 => 1000, etc
        var decPlaces = Math.pow(10,decPlacesNo);
        // Enumerate number abbreviations
        var abbrev = [ "k", "m", "b", "t" ];
        var sign = 1;
        if (number < 0){
            sign = -1;
        }
        number = number * sign;

        // Go through the array backwards, so we do the largest first
        for (var i=abbrev.length-1; i>=0; i--) {
            // Convert array index to "1000", "1000000", etc
            var size = Math.pow(10,(i+1)*3);
            // If the number is bigger or equal do the abbreviation
            if(size <= number) {
                // Here, we multiply by decPlaces, round, and then divide by decPlaces.
                // This gives us nice rounding to a particular decimal place.
                number = Math.round(number*decPlaces/size)/decPlaces;
                // Handle special case where we round up to the next abbreviation
                if((number == 1000) && (i < abbrev.length - 1)) {
                    number = 1;
                    i++;
                }
                number = number * sign;
                // Add the letter for the abbreviation
                number += abbrev[i];
                // We are done... stop
                return number;
            }
        }
        //if we got here we just need to set the decimal places
        number = number * sign;
        return parseFloat(Math.round(number * decPlaces) / decPlaces).toFixed(decPlacesNo);
    }


    /**
     *
     * @param {Array} usableData
     * @param {?string} valuesColumn
     * @param {number} numOfTicks must be an integer value
     * @returns {Array} the y axis values for ticks
     */
    function decideChartValues(usableData, valuesColumn, numOfTicks){
        var maxValue = findMaxValue(usableData, valuesColumn);
        var step = Math.round(maxValue / numOfTicks);
        var roundedStep = computeRoundedStep(step);

        console.log("Step " + step + "; roundedStep  " + roundedStep);

        var values = [];
        var value = roundedStep;
        while (value < maxValue) {
            values.push(value);
            value += roundedStep;
        }
        // values.push(value);

        function findMaxValue(dataList, valuesColumn) {
            var max = 0;

            /** @type {number} the index of the column which contains values */
            var valueColNum = 1;
            if (valuesColumn && dataList.length) {
                var firstRow = dataList[0];
                for (var idx=0; firstRow.length && idx<firstRow.length; idx++) {
                    if (firstRow[idx] == valuesColumn) {
                        valueColNum = idx;
                        // console.log("Found values col index to be " + idx);
                        break;
                    }
                }
            }
            /* Skip the headers */
            for (var i=1; i<dataList.length; i++) {
                var value = dataList[i][valueColNum];
                max = value > max ? value : max;
            }
            return max;
        }

        function computeRoundedStep(step) {
            var roundUpConfig = [
                {limit: 100, rounding: 10},
                {limit: 1000, rounding: 10},
                {limit: 10000, rounding: 100},
                {limit: 100000, rounding: 1000},
                {limit: 1000000, rounding: 10000}
            ];
            var rounding = 10000;
            for (var i = 0; i < roundUpConfig.length; i++) {
                var configItem = roundUpConfig[i];
                if (configItem.limit > step) {
                    rounding = configItem.rounding;
                    break;
                }
            }
            return Math.ceil(step / rounding) * rounding;
        }

        if (values && values.length) {
            values.splice(0, 0, 0); // add a label at 0
        }
        return values;

    }

}(angular.module("hdx.map.explorer.home")));