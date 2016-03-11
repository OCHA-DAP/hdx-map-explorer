(function(app) {

    app.config(function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/home');
    });

    app.run(function () {});

    app.controller('AppController', function ($scope) {

    });

}(angular.module("hdx.map.explorer", [
    'hdx.map.explorer.home',
    'hdx.map.explorer.about',
    'templates-app',
    'templates-common',
    'ui.router.state',
    'ui.router',
])));
