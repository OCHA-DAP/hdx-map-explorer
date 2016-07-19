describe('homeLegend section', function () {

    var $compile;
    var $rootScope;
    var $timeout;
    var scope;
    var $httpBackend;
    var layerListEndpoint;
    var $document;
    var isolatedScope;

    var LAYER_TYPE = "INNEED";
    var LAYER_NAME = "Number of People In Need";

    var colors = ['#000000', '#333333', '#666666', '#999999', '#cccccc'];
    var types = ['bubble', 'choropleth'];
    var permittedLayerTypeNames = {
        Bubble: true,
        Shaded: true
    };

    var layerList = [
        {
            "name": LAYER_NAME,
            "id": "1",
            "description": "Persons in need by admin level 2",
            "type": LAYER_TYPE,
            "url": "assets/inneed.json"
        }
    ];

    var fakeLayer = {
        colors: colors,
        types: types,
        layerInfo: {
            name: 'Test Layer Name',
            type: types[0],
            colors: colors,
            sourceUrl: '/source/url'
        }
    };

    beforeEach(module('hdx.map.explorer.home.legend'));
    beforeEach(module('hdx.map.explorer.util'));
    beforeEach(module('hdx.map.explorer'));
    beforeEach(module('ui.select'));

    beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_, _$httpBackend_, _$document_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
        scope = $rootScope.$new();
        $httpBackend = _$httpBackend_;
        $document = _$document_;

        layerListEndpoint = $httpBackend
            .when('GET', 'assets/datasets.json')
            .respond(200, layerList);
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    function createLegend() {
        $httpBackend.expectGET('assets/datasets.json');
        var element = angular.element('<div id="temp-map"></div>');
        $("#temp-map").remove();
        $("html").append(element);
        scope.map = L.map("temp-map", {});

        element = angular.element('<layer-legend map="map"></layer-legend>');
        element = $compile(element)(scope);
        $httpBackend.flush();
        scope.$digest();
        isolatedScope = element.isolateScope();
        return $(element);
    }

    it('should get the list of layers and render the dropdown', function(){
        var $element = createLegend();

        var $layerChoicesList = $element.find(".legend-list .selector ul.ui-select-choices");
        var $choiceGroup = $layerChoicesList.find("li.ui-select-choices-group .ui-select-choices-group-label");
        expect($choiceGroup.text()).toBe(LAYER_TYPE);
        var $choiceOptions = $layerChoicesList.find("li.ui-select-choices-group");//
        expect($choiceOptions.find('ul').length).toBe(0); //since the dropdown isn't open it won't show the options
    });

    it('should react to the sliceCreated event', function(){
        var $element = createLegend();
        $rootScope.$broadcast("sliceCreated", fakeLayer);
        scope.$digest();
        var $legendItem = $element.find('.legend-item-container .legend-item');
        //check Info link rendered with correct URL
        expect($legendItem.find('.legend-actions > a').attr('href')).toBe(fakeLayer.layerInfo.sourceUrl);
        var $legendTypes = $legendItem.find('.legend-actions .dropdown-menu ul a > li > span');
        //check the layer type dropdown selector has rendered the correct number of options
        expect($legendTypes.length).toBe(types.length);
        //check the layer type dropdown selector has rendered the permitted value names
        for (var i1 = 0; i1 < types.length; i1++){
            expect(permittedLayerTypeNames[$legendTypes.eq(i1).text()]).toBe(true);
        }

        var $legendColors = $legendItem.find('.legend-colors');
        //check that the correct number of colors has been rendered in the legend
        var $colorItems = $legendColors.find('li');
        expect($colorItems.length).toBe(colors.length);
        //check the colors are rendered correctly
        for (var i2 = 0; i2 < colors.length; i2++){
            expect($colorItems.eq(i2).attr('style')).toBe('background-color: ' + colors[i2]);
        }

    });

    it('should emit the correct event and remove the legend when a layer is removed', function(){
        var $element = createLegend();
        $rootScope.$broadcast("sliceCreated", fakeLayer);
        scope.$digest();

        spyOn(isolatedScope, "$emit");

        var sliceType = fakeLayer.layerInfo.type;
        isolatedScope.removeSlice(sliceType);
        scope.$digest();
        //check the legend item isn't there anymore
        var $legendItem = $element.find('.legend-item-container .legend-item');
        expect($legendItem.length).toBe(0);
        expect(isolatedScope.$emit).toHaveBeenCalledWith("removeSlice", sliceType);
    });

    it('should emit the addSlice event wieh a new slice is selected', function(){
        var $element = createLegend();
        $rootScope.$broadcast("sliceCreated", fakeLayer);
        scope.$digest();

        spyOn(isolatedScope, "$emit");

        isolatedScope.selectSlice(layerList[0]);
        scope.$digest();

        expect(isolatedScope.$emit).toHaveBeenCalledWith("addSlice", {url: layerList[0].url});
    });

    it('should emit the resetSlice event', function(){
        var $element = createLegend();
        $rootScope.$broadcast("sliceCreated", fakeLayer);
        scope.$digest();

        spyOn(isolatedScope, "$emit");

        var sliceType = fakeLayer.layerInfo.type;
        isolatedScope.resetSlice(sliceType);
        scope.$digest();

        expect(isolatedScope.$emit).toHaveBeenCalledWith("resetSlice", sliceType);
    });

    it('should emit the changeSlice event', function(){
        var $element = createLegend();
        $rootScope.$broadcast("sliceCreated", fakeLayer);
        scope.$digest();

        spyOn(isolatedScope, "$emit");

        var sliceType = fakeLayer.layerInfo.type;
        isolatedScope.changeType(sliceType, sliceType);
        scope.$digest();
        //it shouldn't have sent the event if user chose the same type as the slice has now
        expect(isolatedScope.$emit).not.toHaveBeenCalled();

        isolatedScope.changeType(types[0], types[1]);
        scope.$digest();
        //it shouldn't have sent the event if user chose the same type as the slice has now
        expect(isolatedScope.$emit).toHaveBeenCalledWith('changeSlice', {
            oldType: types[0],
            newType: types[1]
        });

    });

    it('should have a dummy test', inject(function() {
        expect(true).toBeTruthy();
    }));
});