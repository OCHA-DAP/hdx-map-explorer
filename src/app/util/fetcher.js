(function(module) {

    module.service("DataFetcher", function($q, $http){
        var ret = {};

        ret.getData = function (){
            var deferred = $q.defer();
            //$http.get("/myURL")
            //    .then(function(data){
            //        deferred.resolve(data);
            //    }, function(error){
            //        deferred.reject(error);
            //    });
            var ret = {
                result: "Dan e tare!"
            };
            deferred.reject(ret);

            return deferred.promise;
        };

        return ret;
    });

}(angular.module("hdx.map.explorer.util")));