(function(module) {
    module.directive("appHeader", function(){
        return {
            restrict: "E",
            scope: {
                name: '=',
                description: '=',
                user: '='
            },
            templateUrl: "home/app-header-directive.tpl.html",
            link: function ($scope, element, attrs, controller) {
                $scope.name = $scope.name ? $scope.name : "Add data layers from the dropdown to generate interactive visualisation";
            }
        };
    });

    

}(angular.module("hdx.map.explorer.home")));