(function(module) {
    module.directive("sharingWidget", function(APP_CONFIG){
        return {
            restrict: "E",
            scope: {
                configManager: '=',
                crisisTitle: '=',
                show: '='
            },
            templateUrl: "home/saving/sharing-widget-directive.tpl.html",
            link: function ($scope, element, attrs, controller) {
                $scope.model = {};
                $scope.model.configName = "";
                $scope.model.configDescription = "";
                $scope.mode = "save"; // decides what will be shown in the widget
                $scope.ckanVizList = APP_CONFIG.ckanUrl + '/dashboard/visualizations';

                var modal = $(element).find('.modal');
                modal.on('hidden.bs.modal', function (e) {
                    $scope.$apply(function(){$scope.show = false;});
                });
                $scope.hideWidget = function () {
                  modal.modal('hide');
                };
                $scope.$watch('show', function () {
                    console.log("Show modified to " + $scope.show);
                    if ($scope.show) {
                        $scope.mode = "save";
                        modal.modal('show');
                    }
                });

                $scope.save = function(model) {
                    $scope.configManager.saveCurrentConfigToServer(model.configName, model.configDescription)
                        .then(function(response){

                        try{
                            var id = response.data.result.id;
                            var ckanLoadPart = APP_CONFIG.ckanUrl + APP_CONFIG.ckanLoadPath + "?id=" + id;
                            $scope.configURL = APP_CONFIG.mapExplorerURL + "/#/load/" + encodeURIComponent(ckanLoadPart);
                            $scope.mode = "share";
                            $('#shareable-url').focus();
                            $('#shareable-url').select();

                        }
                        catch (e){
                            alert("There was an error saving the visualisation");
                        }
                    }, function(){
                       alert("There was an error saving the visualisation");
                    });
                };
            }

        };

    });



}(angular.module("hdx.map.explorer.home.saving")));