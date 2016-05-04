(function(module) {

    module.service("FilterBuilder", function($q, $http){

        var OPERATIONS = [FilterSelect, FilterSum, FilterMax, FilterSort, FilterRemoveDuplicates, FilterKeepRemove];

        /**
         * SELECT (filtering) operation
         * @param options
         * @constructor
         */
        function FilterSelect(options){
            this.options = options;
            this.indicesNeeded = 1;
            this.generatedUrl = '';
        }
        FilterSelect.prototype.type = "select";
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

        /**
         * SUM operation
         * @param options
         * @constructor
         */
        function FilterSum(options){
            FilterSelect.call(this, options);
            this.indicesNeeded = 3;
            this.aggregationType = "sum";
        }
        FilterSum.prototype = new FilterSelect();
        FilterSum.prototype.type = "sum";
        FilterSum.prototype.generateURL = function (index) {

            var keepColumnName = "#meta+" + this.aggregationType;
            var newTagName = this.options.avgColumn + "+" + this.aggregationType;

            var idx = this.generateIndexString(index);
            var paramList = [
                {"key": "filter" + idx, "value": "count"},
                {"key": "count-tags" + idx, "value": this.options.groupByColumn},
                {"key": "count-aggregate-tag" + idx, "value": this.options.avgColumn}
            ];

            var idx2 = this.generateIndexString(index+1);
            paramList.push({"key": "filter" + idx2, "value": "cut"});
            paramList.push({
                "key": "cut-include-tags" + idx2,
                "value": this.options.groupByColumn + "," + keepColumnName
            });

            var idx3 = this.generateIndexString(index+2);
            paramList.push({"key": "filter" + idx3, "value": "rename"});
            paramList.push({"key": "rename-oldtag" + idx3, "value": keepColumnName});
            paramList.push({"key": "rename-newtag" + idx3, "value": newTagName});
            paramList.push({"key": "rename-header" + idx3, "value": newTagName});

            this.generatedUrl = this.buildUrlStringFromList(paramList);

            return this;
        };

        /**
         * MAX operation
         * @param options
         * @constructor
         */
        function FilterMax(options){
            FilterSum.call(this, options);
            this.aggregationType = "max";
        }
        FilterMax.prototype = new FilterSum();
        FilterMax.prototype.type = "max";

        /**
         * SORT operation
         * @param options
         * @constructor
         */
        function FilterSort(options) {
            FilterSelect.call(this, options);
        }

        FilterSort.prototype = new FilterSelect();
        FilterSort.prototype.type = "sort";
        FilterSort.prototype.generateURL = function (index) {
            var idx = this.generateIndexString(index);
            var paramList = [
                {"key": "filter" + idx, "value": "sort"},
                {"key": "sort-tags" + idx, "value": this.options.columns ? this.options.columns.toString() : ""}
            ];

            if ( this.options.order &&
                ["desc", "descending"].indexOf(this.options.order) >= 0 ) {
                paramList.push({"key": "sort-reverse" + idx, "value": "on"});
            }

            this.generatedUrl = this.buildUrlStringFromList(paramList);
            return this;
        };


        /**
         * KEEP OR REMOVE COLUMNS operation
         * @param options
         * @constructor
         */
        function FilterKeepRemove(options){
            FilterSelect.call(this, options);
        }
        FilterKeepRemove.prototype = new FilterSelect();
        FilterKeepRemove.prototype.type = "keep-remove";
        FilterKeepRemove.prototype.generateURL = function (index) {
            var idx = this.generateIndexString(index);
            var paramList = [
                {"key": "filter" + idx, "value": "cut"},
                {
                    "key": "cut-include-tags" + idx,
                    "value": this.options.keepColumns ? this.options.keepColumns.toString() : ""
                },
                {
                    "key": "cut-exclude-tags" + idx,
                    "value": this.options.removeColumns ? this.options.removeColumns.toString() : ""
                }
            ];

            this.generatedUrl = this.buildUrlStringFromList(paramList);

            return this;
        };

        /**
         * REMOVE DUPLICATE COLUMNS operation
         * @param options
         * @constructor
         */
        function FilterRemoveDuplicates(options){
            FilterSelect.call(this, options);
        }
        FilterRemoveDuplicates.prototype = new FilterSelect();
        FilterRemoveDuplicates.prototype.type = "remove-duplicates";
        FilterRemoveDuplicates.prototype.generateURL = function (index) {
            var idx = this.generateIndexString(index);
            var paramList = [
                {"key": "filter" + idx, "value": "dedup"},
                {
                    "key": "dedup-tags" + idx,
                    "value": this.options.columns ? this.options.columns.toString() : ""
                }
            ];

            this.generatedUrl = this.buildUrlStringFromList(paramList);

            return this;
        };

        var TYPE_TO_OPERATION = null;
        function constructFilterElement(type, options){
            if (!TYPE_TO_OPERATION) {
                TYPE_TO_OPERATION = {};
                for (var i=0; i<OPERATIONS.length; i++) {
                    var op = OPERATIONS[i];
                    TYPE_TO_OPERATION[op.prototype.type] = op;
                }
            }

            if (TYPE_TO_OPERATION[type]){
                return new TYPE_TO_OPERATION[type](options);
            }

            throw "Unsupported filter type " + type;

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