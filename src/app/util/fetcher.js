(function(module) {

    module.service("DataFetcher", function($q, $http, FilterBuilder, APP_CONFIG){

        //var hxlUrl = 'https://proxy.hxlstandard.org/data.json?url=http%3A//popstats.unhcr.org/en/demographics.hxl&select-query01-01=%23country%2Bresidence%3DSlovenia&filter01=select';
        //var urlPrefix = 'https://proxy.hxlstandard.org/data.json?';
        //var urlPrefix = 'https://liv-proxy.hdx.rwlabs.org/data.json?';
        //var genericUrl = 'url={originalUrl}&select-query01-01={selectKey}={selectValue}&filter01=select';

        //For local deploy
        var urlPrefix = APP_CONFIG.hxlProxy;
        //For HDX deploy
        //var urlPrefix = '/hxlproxy/data.json?';


        var ret = {};

        ret.getFilteredDataBy1Value = function (originalUrl, selectKey, selectValue){
            var urlValue = encodeURIComponent(originalUrl);
            var hxlUrl = urlPrefix + 'url=' + urlValue;
            if (selectKey && selectValue) {
                var queryValue = encodeURIComponent(selectKey + "=" + selectValue);
                hxlUrl += '&select-query01-01=' + queryValue + '&filter01=select';
            }

            var deferred = $q.defer();
            $http.get(hxlUrl)
                .then(function(data){
                    deferred.resolve(data);
                    console.log(data);
                }, function(error){
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        // ret.buildNewParam = function (filterKey, filterValue, filterIndex){
        //     var paramValue = encodeURIComponent(filterKey + "=" + filterValue);
        //     var param = "&filter" + filterIndex + "=select&select-query" + filterIndex + "-01=" + paramValue;
        //     //var param = "select-query" + filterIndex + "-01=" + paramValue;
        //
        //     return param;
        // };

        ret.getFilteredData = function (originalUrl, paramString) {
            var url = urlPrefix + 'url=' + originalUrl + '&' + paramString;
            return $http.get(url);

        };

        ret.fetchData = function(url, data, additionalFilters){
            var operations = data.operations;
            if (additionalFilters && additionalFilters.length > 0) {
                operations = additionalFilters.concat(operations);
                for (var i=0; i<additionalFilters.length; i++) {
                    var filter = additionalFilters[i];
                    if (filter.type == "select") {
                        var removeIndex = -1;
                        for (var j=additionalFilters.length; j<operations.length; j++){
                            var op = operations[j];
                            if ( op.type == "select" && op.options.column == filter.options.column ) {
                                /**
                                 * If we already have a filter on the same column, then remove it.
                                 * We assume for now that there can't be more than 1 filter for a particular column
                                 */
                                removeIndex = j;
                                break;
                            }
                        }
                        if (removeIndex > 0) {
                            operations.splice(removeIndex, 1);
                        }
                        else {
                            console.log("No need to remove any existing filter");
                        }
                    }
                }
            }
            var paramString = FilterBuilder.buildFilter(operations);
            var promise = this.getFilteredData(url, paramString);
            return promise;
        };

        ret.loadDatasets = function(){
            return $http.get('assets/datasets.json');
        };

        return ret;
    });

}(angular.module("hdx.map.explorer.util")));