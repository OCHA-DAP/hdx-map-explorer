(function(module) {
    module.config(function ($stateProvider) {

        $stateProvider.state('load', {
            url: '/load/{url:.*}',
            views: {
                "main": {
                    controller: 'LoadController as model',
                    templateUrl: 'home/home.tpl.html'
                }
            },
            data:{ pageTitle: 'Home' }
        });

        $stateProvider.state('default', {
            url: '/',
            views: {
                "main": {
                    controller: 'RedirectDefaultController as model'
                }
            }
        });

        $stateProvider.state('home', {
            url: '/name/:name',
            views: {
                "main": {
                    controller: 'HomeController as model',
                    templateUrl: 'home/home.tpl.html'
                }
            },
            data:{ pageTitle: 'Home' }
        });

        $stateProvider.state('load-slice', {
            url: '/name/:name/:sliceId',
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
