(function(module) {
    
    module.config(function ($stateProvider) {
        $stateProvider.state('landing', {
            url: '/',
            views: {
                "main": {
                    controller: 'LandingController as model',
                    templateUrl: 'landing/landing.tpl.html'
                }
            },
            data:{ pageTitle: 'Landing' }
        });
    });
    
}(angular.module('hdx.map.explorer.landing', [
    'ui.router'
])));
