(function(module) {

    module.service("DataFetcher", function($q, $http){

        //var hxlUrl = 'https://proxy.hxlstandard.org/data.json?url=http%3A//popstats.unhcr.org/en/demographics.hxl&select-query01-01=%23country%2Bresidence%3DSlovenia&filter01=select';
        var urlPrefix = 'https://proxy.hxlstandard.org/data.json?';
        //var genericUrl = 'url={originalUrl}&select-query01-01={selectKey}={selectValue}&filter01=select';

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
            //var ret = {
            //    result: "Dan e tare!"
            //};
            //deferred.reject(ret);

            return deferred.promise;
        };

        ret.buildNewParam = function (filterKey, filterValue, filterIndex){
            var paramValue = encodeURIComponent(filterKey + "=" + filterValue);
            var param = "&filter" + filterIndex + "=select&select-query" + filterIndex + "-01=" + paramValue;
            //var param = "select-query" + filterIndex + "-01=" + paramValue;

            return param;
        };

        ret.getFilteredDataByParamList = function (originalUrl, paramList) {
            var url = urlPrefix + 'url=' + originalUrl;
            for (var i=0; i<paramList.length; i++) {
                url += '&' + paramList[i];
            }
            return $http.get(url);

        };

        return ret;
    });

}(angular.module("hdx.map.explorer.util")));