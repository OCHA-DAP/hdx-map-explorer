describe('home section', function () {

    var $compile;
    var $rootScope;
    var $timeout;
    var scope;
    var $httpBackend;
    var dataUrl;
    var chartItem = {
        charts:[
            {
                "name": "Number of Displaced Over Time",
                "options": {
                    "data": {
                        "x": "#date+bin",
                        "y": "#affected+displaced+sum",
                        "type": "area"
                    },
                    "axis": {
                        "x": {
                            "type": "timeseries",
                            "tick": {
                                "format": "%B %Y",
                                "rotate": 30
                            },
                            "height": 60
                        }
                    }
                },
                "operations": [
                    {
                        "type": "select",
                        "options": {
                            "column": "#affected+type",
                            "operator": "=",
                            "value": "idp"
                        }
                    },
                    {
                        "type": "sort",
                        "options": {
                            "columns": "#date+bin"
                        }
                    },
                    {
                        "type": "sum",
                        "options": {
                            "groupByColumn": "#date+bin",
                            "statsColumn": "#affected+displaced"
                        }
                    }
                ]
            }
        ],
        url: "/chart/data/url",
        selections: {
        }
    };
    var fakeData = [
        ["Period", "#affected+displaced+sum"],
        ["#date+bin", "#affected+displaced+sum"],
        ["2015-02-28", 0],
        ["2015-04-30", 1],
        ["2015-06-30", 2],
        ["2015-08-31", 3],
        ["2015-10-31", 4],
        ["2015-12-31", 5],
        ["2016-02-29", 6],
        ["2016-04-30", 7],
        ["2016-06-30", 8]
    ];



    beforeEach(module('hdx.map.explorer.home'));
    beforeEach(module("hdx.map.explorer"));

    beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_, _$httpBackend_, _APP_CONFIG_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
        scope = $rootScope.$new();
        $httpBackend = _$httpBackend_;

        dataUrl = _APP_CONFIG_.hxlProxy + "url=" + chartItem.url + "&filter01=select&select-query01-01=%23affected%2Btype%3Didp&filter02=sort&sort-tags02=%23date%2Bbin&filter03=count&count-tags03=%23date%2Bbin&count-aggregate-tag03=%23affected%2Bdisplaced&filter04=cut&cut-include-tags04=%23date%2Bbin%2C%23meta%2Bsum&filter05=rename&rename-oldtag05=%23meta%2Bsum&rename-newtag05=%23affected%2Bdisplaced%2Bsum&rename-header05=%23affected%2Bdisplaced%2Bsum&";

        scope.charts = chartItem;
        layerListEndpoint = $httpBackend
            .when('GET', dataUrl)
            .respond(200, fakeData);
    }));

    it('should render the chart item requesting data from the server', function(){
        $httpBackend.expectGET(dataUrl);

        var element = angular.element('<chart-item chart-id="\'id1\'" data="charts" url="charts.url" type="type"></chart-item>');
        var $element = $($compile(element)(scope));
        scope.$digest();
        $httpBackend.flush();
        scope.$digest();

        var $chartBox = $element.find(".chart-box");
        // console.log($chartBox.find('div.dropdown.with-transparent-button'));
        //we don't have other chart options for this data - so the dropdown shouldn't appear
        expect($chartBox.find('div.dropdown.with-transparent-button').length).toBe(0);
        //check that the title has been correctly rendered
        expect($chartBox.find('div.dropdown .grouping-title').text()).toBe(chartItem.charts[0].name);
        //check no filters appliedh
        expect($chartBox.find('div.dropdown .filterby-title').length).toBe(0);
        //check that chart container is ready for c3 to render
        expect($chartBox.find('.chart-item-wrapper').length).toBe(1);
    });

    it('should have a dummy test', inject(function() {
        expect(true).toBeTruthy();
    }));

});
