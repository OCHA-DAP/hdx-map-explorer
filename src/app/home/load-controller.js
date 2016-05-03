(function (module) {
    module.controller('LoadController', function ($scope, $controller, $stateParams) {
        if ($stateParams.url) {
            $scope.loadConfigUrl = $stateParams.url;
        }
        $controller("HomeController", {$scope: $scope});
    });

 }(angular.module("hdx.map.explorer.home")));