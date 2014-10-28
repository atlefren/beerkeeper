var BK = this.BK || {};
(function (ns) {
    'use strict';


    function createGraphData(dict) {
        var beerData = _.map(dict, function (value, key) {
            return {x: moment(key).valueOf(), y: value.beers};
        });
        var runData = _.map(dict, function (value, key) {
            return {x: moment(key).valueOf(), y: value.km_run};
        });
        return [
            {
                values: beerData,
                key: 'Beers',
                color: '#ff7f0e'
            },
            {
                values: runData,
                key: 'Km run',
                color: '#007f0e'
            }
        ];
    };


    ns.printGraph = function (dict, elementId) {
        nv.addGraph(function() {
            var chart = nv.models.lineChart()
                    .margin({left: 100, right: 100})
                    .useInteractiveGuideline(false)
                    .transitionDuration(350)
                    .showLegend(true)
                    .showYAxis(true)
                    .showXAxis(true);

            chart.xAxis
                .axisLabel('Date')
                .tickFormat(function(d) {
                    return d3.time.format('%d %b %Y')(new Date(d));
                });

            chart.yAxis
                .tickFormat(d3.format('.02f'));

            d3.select('#' + elementId)
                .datum(createGraphData(dict))
                .call(chart);

            nv.utils.windowResize(function() {
                chart.update();
            });
        });
    };

}(BK));
