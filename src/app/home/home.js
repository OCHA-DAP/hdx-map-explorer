(function(module) {
    module.controller('HomeController', function () {
        var model = this;
        model.buttonClick = clickMapExplorer;

        init();

        function init() {
        }

        function clickMapExplorer() {
            alert('Coming soon :)');
        }

    });
}(angular.module("hdx.map.explorer.home")));