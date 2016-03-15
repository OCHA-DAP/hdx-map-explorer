(function(module) {
    module.config(function ($stateProvider) {
        $stateProvider.state('home', {
            url: '/',
            views: {
                "main": {
                    controller: 'HomeController as model',
                    templateUrl: 'home/home.tpl.html'
                }
            },
            data:{ pageTitle: 'Home' }
        });
    });
}(angular.module("hdx.map.explorer.home", [
    'ui.router',
    'hdx.map.explorer.util'
])));
