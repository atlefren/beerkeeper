var BK = this.BK || {};
(function (ns) {
    
    'use strict';

    function createGraphData(dict) {
        console.log(dict);
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

    ns.printGraph = function (dict) {

        /*These lines are all chart setup.  Pick and choose which chart features you want to utilize. */
        nv.addGraph(function() {
            var chart = nv.models.lineChart()
                    .margin({left: 100, right: 100})  //Adjust chart margins to give the x-axis some breathing room.
                    .useInteractiveGuideline(false)  //We want nice looking tooltips and a guideline!
                    .transitionDuration(350)  //how fast do you want the lines to transition?
                    .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
                    .showYAxis(true)        //Show the y-axis
                    .showXAxis(true)        //Show the x-axis
            ;

            chart.xAxis
                .axisLabel('Date')
                .tickFormat(function(d) {
                    return d3.time.format('%d %b %Y')(new Date(d));
                });

            chart.yAxis     //Chart y-axis settings
                .tickFormat(d3.format('.02f'));

            /* Done setting the chart up? Time to render it!*/

            d3.select('#chart svg')    //Select the <svg> element you want to render the chart in.   
                .datum(createGraphData(dict))         //Populate the <svg> element with chart data...
                .call(chart);          //Finally, render the chart!

            //Update the chart when window resizes.
            nv.utils.windowResize(function() {
                chart.update();
            });
            return chart;
        });
    };

}(BK));
