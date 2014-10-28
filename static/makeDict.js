var BK = this.BK || {};
(function (ns) {
    'use strict';

    ns.defDict = function (constructor) {
        var dict = {};
        return {
            get: function (key) {
                if (!dict[key]) {
                    dict[key] = constructor();
                }
                return dict[key];
            },
            dict: dict
        };
    };


    function mapToDates(items, dateParam) {
        return _.reduce(items, function (res, item) {
            var d = moment(item[dateParam]).format('YYYY-MM-DD');
            res.get(d).push(item);
            return res;
        }, ns.defDict(function () { return []; })).dict;
    }


    function getDates(beerDates, runDates) {
        return _.union(_.keys(beerDates), _.keys(runDates)).sort();
    }


    function getDatesBetween(start, end) {
        var range = moment().range(moment(start), moment(end));
        var dates = [];
        range.by('days', function (day) {
            dates.push(day.format('YYYY-MM-DD'));
        });
        return dates;
    }


    function fillDates(days) {
        return _.reduce(days, function (res, day) {
            res[day] = {beers: 0, km_run: 0};
            return res;
        }, {});
    }


    function sum(arr) {
        return _.reduce(arr, function (total, val) {
            total += val;
            return total;
        }, 0);
    }


    function fillBeers(days, beerDates) {
        _.each(beerDates, function (beers, day) {
            days[day].beers = beers.length;
        });
    }


    function fillRuns(days, runDates) {
        _.each(runDates, function (runs, day) {
            days[day].km_run = sum(_.pluck(runs, 'total_distance')) / 1000;
        });
    }


    ns.makeDict = function (checkins, runs) {
        var beerDates = mapToDates(checkins, 'created_at');
        var runDates = mapToDates(runs, 'start_time');
        var dates = getDates(beerDates, runDates);
        var allDates = getDatesBetween(dates[0], moment());

        var dict = fillDates(allDates);
        fillBeers(dict, beerDates);
        fillRuns(dict, runDates);
        return dict;
    };


}(BK));
