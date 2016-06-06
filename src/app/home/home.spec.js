describe('home section', function () {

    var $compile;
    var $rootScope;
    var $timeout;
    var scope;
    var $httpBackend;

    beforeEach(module('hdx.map.explorer.home'));

    beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_, _$httpBackend_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
        scope = $rootScope.$new();
        $httpBackend = _$httpBackend_;
    }));




    it('should have a dummy test', inject(function() {
        expect(true).toBeTruthy();
    }));



});
