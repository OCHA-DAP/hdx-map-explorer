describe('Saving Module - ', function () {
    var $compile;
    var $rootScope;
    var scope;
    var APP_CONFIG;

    beforeEach(module('hdx.map.explorer.home.saving'));
    beforeEach(module("hdx.map.explorer"));

    beforeEach(inject(function(_$compile_, _$rootScope_, _APP_CONFIG_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();
        APP_CONFIG = _APP_CONFIG_;
    }));

    it('should have a dummy test', inject(function() {
        expect(true).toBeTruthy();
    }));


    describe('App Header directive - ', function(){
        beforeEach(function(){
           angular.extend(scope, {
               name: "Test Header",
               title: "Lake Chad Basin Crisis",
               loggedIn: "HDX"
           });
        });

        it('should fail with no parameters', function(){
            expect(function(){
                var element = angular.element('<app-header></app-header>');
                element = $compile(element)(scope);
                scope.$digest();
            }).toThrow();
        });

        it('should render the header with login button', function(){
            var element = angular.element('<app-header name="name" title="title"></app-header>');
            element = $compile(element)(scope);
            
            scope.$digest();
            var $element = $(element);
            var mainTitle = $element.find('div.title');
            expect(mainTitle.text()).toBe("Lake Chad Basin Crisis");
            var login = $element.find('.actions a');
            expect(login.text()).toBe('SAVE');
        });

        it('should render the header with save button', function(){
            var element = angular.element('<app-header name="name" title="title" logged-in="loggedIn"></app-header>');
            element = $compile(element)(scope);
            scope.$digest();
            var $element = $(element);
            var mainTitle = $element.find('div.title');
            expect(mainTitle.text()).toBe("Lake Chad Basin Crisis");
            var save = $element.find('.actions a');
            expect(save.text()).toBe('SAVE');
        });
    });

});