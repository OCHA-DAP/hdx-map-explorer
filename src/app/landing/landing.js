(function(module) {
    
    module.controller('LandingController', function ($scope, $http, $q) {
        var model = this;

        init();

        function init() {

            $http.get('assets/json/crisis/crisis.json')
                .then(function(result){
                    var activeCrisis = result.data.active;
                    var promiseList = [];
                    for (var i = 0; i < activeCrisis.length; i++){
                        var c = activeCrisis[i];
                        promiseList.push($http.get('assets/json/crisis/' + c + '/config.json'));
                    }

                    return $q.all(promiseList);
                })
                .then(function(crises){
                    console.log(crises);
                    var result = [];
                    for (var i = 0; i < crises.length; i++){
                        var c = crises[i].data;
                        result.push(c);
                    }

                    $scope.crisisList = result;
                });

        }
    });
    
}(angular.module("hdx.map.explorer.landing")));