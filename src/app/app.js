(function(app) {

    app.config(function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/');
    });

    app.run(function () {});

    app.controller('AppController', function ($scope) {

    });

}(angular.module("hdx.map.explorer", [
    'templates-app',
    'templates-common',
    'ui.router.state',
    'ui.router',
    'ui.select',
    'angular.filter',
    //pages
    'hdx.map.explorer.home',
    'hdx.map.explorer.util',
    'hdx.map.explorer.util.loader',
    'hdx.map.explorer.home.legend',
])));
