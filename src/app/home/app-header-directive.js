(function(module) {
    module.directive("appHeader", function(){
        return {
            restrict: "E",
            scope: {
                name: '=',
                description: '=',
                user: '=',
                configManager: '='
            },
            templateUrl: "home/app-header-directive.tpl.html",
            link: function ($scope, element, attrs, controller) {
                $scope.name = $scope.name ? $scope.name : "Add data layers from the dropdown to generate interactive visualisation";

                $scope.sharingWidgetVisible = false;
                $scope.showSharingWidget = function() {
                    $scope.sharingWidgetVisible = true;
                    console.log("Made show true");
                };
            }
        };
    });

    

}(angular.module("hdx.map.explorer.home")));