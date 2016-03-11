(function(module) {
    module.config(function ($stateProvider) {
        $stateProvider.state('home', {
            url: '/home',
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
    'ui.router'
])));
