(function(module) {

    module.service("FilterBuilder", function($q, $http){

        function FilterSelect(type, options){
            this.type = type;
            this.options = options;
            this.indicesNeeded = 1;
            this.generatedUrl = '';
        }
        FilterSelect.prototype.buildUrlStringFromList = function (paramList) {
            var urlString = '';
            if (paramList) {
                for (var i=0; i<paramList.length; i++ ) {
                    var el = paramList[i];
                    urlString += el.key + "=" + encodeURIComponent(el.value) + "&";
                }
            }
            return urlString;
        };
        FilterSelect.prototype.generateIndexString = function (index) {
            return index < 10 ? "0" + index : "" + index;
        };
        FilterSelect.prototype.generateURL = function (index) {
            var idx = this.generateIndexString(index);
            var paramList = [
                {"key": "filter" + idx, "value": "select"},
                {"key": "select-query" + idx + "-01", "value": this.options.column + this.options.operator + this.options.value}
            ];
            // var preParam = "filter" + this.generateIndexString(index) + "=select&";
            // var paramValue = encodeURIComponent(this.options.column + this.options.operator + this.options.value);
            // var param = "select-query" + indexString + "-01=" + paramValue + "&";
            this.generatedUrl = this.buildUrlStringFromList(paramList);
            return this;
        };

        function FilterSum(type, options){
            FilterSelect.call(this, type, options);
            this.indicesNeeded = 3;
        }
        FilterSum.prototype = new FilterSelect();
        FilterSum.prototype.generateURL = function (index) {
            var idx = this.generateIndexString(index);
            var paramList = [
                {"key": "filter" + idx, "value": "count"},
                {"key": "count-tags" + idx, "value": this.options.groupByColumn},
                {"key": "count-aggregate-tag" + idx, "value": this.options.avgColumn}
            ];
            // var preParam = "filter" + idx + "=count&";
            // var param = "count-tags" + idx + "=" + encodeURIComponent(this.options.groupByColumn) + "&";
            // var paramAggregate = "count-aggregate-tag" + idx + "=" + encodeURIComponent(this.options.avgColumn) + "&";
            var idx2 = this.generateIndexString(index+1);
            paramList.push({"key": "filter" + idx2, "value": "cut"});
            paramList.push({"key": "cut-include-tags" + idx2, "value": this.options.groupByColumn + ",#meta+sum"});

            var idx3 = this.generateIndexString(index+2);
            paramList.push({"key": "filter" + idx3, "value": "rename"});
            paramList.push({"key": "rename-oldtag" + idx3, "value": "#meta+sum"});
            paramList.push({"key": "rename-newtag" + idx3, "value": this.options.avgColumn + "+sum"});
            paramList.push({"key": "rename-header" + idx3, "value": this.options.avgColumn + "+sum"});

            this.generatedUrl = this.buildUrlStringFromList(paramList);

            return this;
        };

        function FilterSort(type, options) {
            FilterSelect.call(this, type, options);
        }

        FilterSort.prototype = new FilterSelect();
        FilterSort.prototype.generateURL = function (index) {
            var idx = this.generateIndexString(index);
            var paramList = [
                {"key": "filter" + idx, "value": "sort"},
                {"key": "sort-tags" + idx, "value": this.options.columns}
            ];
            this.generatedUrl = this.buildUrlStringFromList(paramList);
            return this;
        };

        function constructFilterElement(type, options){
            if (type=='select') {
                return new FilterSelect(type, options);
            }
            else if (type=='sum') {
                return new FilterSum(type, options);
            }
            else if (type=='sort') {
                return new FilterSort(type, options);
            }
            else {
                throw "Unsupported filter type " + type;
            }
        }

        function buildFilter(operationList) {
            var filterList = [];
            var ret = "";
            if (operationList) {
                for (var i=0; i<operationList.length; i++){
                    var operation = operationList[i];
                    filterList.push(constructFilterElement(operation.type, operation.options));
                }
                var index = 1;
                for (var j=0; j<filterList.length; j++){
                    var filter = filterList[j];
                    ret += filter.generateURL(index).generatedUrl;
                    index += filter.indicesNeeded;
                }
            }
            return ret;
        }

        var ret = {
            "buildFilter": buildFilter
        };
        return ret;

    });
 }(angular.module("hdx.map.explorer.util")));