(function (module) {
    module.controller('RedirectDefaultController', function ($state) {
        //Default crisis :)
        $state.go(
            "home",
            {
                name: "lake-chad"
            }
        );
    });

}(angular.module("hdx.map.explorer.home")));