(function(module) {

    module.service("FilterBuilder", function($q, $http){

        /**
         * SELECT (filtering) operation
         * @param type
         * @param options
         * @constructor
         */
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

        /**
         * SUM operation
         * @param type
         * @param options
         * @constructor
         */
        function FilterSum(type, options){
            FilterSelect.call(this, type, options);
            this.indicesNeeded = 3;
            this.aggregationType = "sum";
        }
        FilterSum.prototype = new FilterSelect();
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
         * @param type
         * @param options
         * @constructor
         */
        function FilterMax(type, options){
            FilterSum.call(this, type, options);
            this.aggregationType = "max";
        }
        FilterMax.prototype = new FilterSum();

        /**
         * SORT operation
         * @param type
         * @param options
         * @constructor
         */
        function FilterSort(type, options) {
            FilterSelect.call(this, type, options);
        }

        FilterSort.prototype = new FilterSelect();
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
         * @param type
         * @param options
         * @constructor
         */
        function FilterKeepRemove(type, options){
            FilterSelect.call(this, type, options);
        }
        FilterKeepRemove.prototype = new FilterSelect();
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
         * @param type
         * @param options
         * @constructor
         */
        function FilterRemoveDuplicates(type, options){
            FilterSelect.call(this, type, options);
        }
        FilterRemoveDuplicates.prototype = new FilterSelect();
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


        function constructFilterElement(type, options){
            if (type=='select') {
                return new FilterSelect(type, options);
            }
            else if (type=='sum') {
                return new FilterSum(type, options);
            }
            else if (type == 'max') {
                return new FilterMax(type, options);
            }
            else if (type=='sort') {
                return new FilterSort(type, options);
            }
            else if (type == 'keep-remove') {
                return new FilterKeepRemove(type, options);
            }
            else if (type == 'remove-duplicates') {
                return new FilterRemoveDuplicates(type, options);
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