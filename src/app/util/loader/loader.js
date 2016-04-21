(function(module) {

    module.config(function($httpProvider){
        $httpProvider.interceptors.push('LoaderInterceptor');
    });

    module.factory("LoaderInterceptor", function ($rootScope){
        return {
            'request': function (config) {
                console.log("Request");
                $rootScope.$emit("loader-start-event");
                // Successful request method
                return config; // or $q.when(config);
            },
            'response': function (response) {
                console.log("Response");
                $rootScope.$broadcast("loader-stop-event");
                // successful response
                return response; // or $q.when(config);
            },
            'requestError': function (rejection) {
                console.log("Request Error");
                //$rootScope.$broadcast("loader-stop-event");

                // an error happened on the request
                // if we can recover from the error
                // we can return a new request
                // or promise
                return response; // or new promise
                // Otherwise, we can reject the next
                // by returning a rejection
                // return $q.reject(rejection);
            },
            'responseError': function (rejection) {
                console.log("Response Error");
                $rootScope.$emit("loader-stop-event");
                // an error happened on the request
                // if we can recover from the error
                // we can return a new response
                // or promise
                return rejection; // or new promise
                // Otherwise, we can reject the next
                // by returning a rejection
                // return $q.reject(rejection);
            }
        };
    });

    module.directive("loaderMask", function($rootScope){
        return {
            restrict: "E",
            scope: {
                // Private scope so that the 1 second tick doesn't trigger all scope digest functions.
            },
            templateUrl: function(element, attr){
                return attr.templateUrl || 'util/loader/loader.tpl.html';
            },
            link: function($scope, element, attrs, controller){
                $scope.count = 0;
                //
                $rootScope.$on("loader-start-event", function(){
                    $scope.count++;
                    element.css("display", "block");
                    console.log("Count++: " + $scope.count);
                });
                $rootScope.$on("loader-stop-event", function(){
                    if ($scope.count > 0){
                        $scope.count--;
                    }
                    console.log("Count--: " + $scope.count);
                    if ($scope.count === 0){
                        element.css("display", "none");
                    }
                });
            }
        };
    });

}(angular.module("hdx.map.explorer.util.loader")));