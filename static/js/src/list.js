/*global moment, _, console, $*/
var BK = this.BK || {};
(function (ns) {
    'use strict';

    function round(number, decimals) {
        var exp = Math.pow(10, decimals);
        return Math.round(number * exp) / exp;
    }


    function aggregate(dict, format) {

        var acc = ns.defDict(function () {
            return {beers: 0, km_run: 0};
        });

        return _.reduce(dict, function (res, val, key) {
            var d = moment(key).format(format);
            var item = res.get(d);
            item.beers += val.beers;
            item.km_run += val.km_run;
            return res;
        }, acc).dict;
    }


    function bpk(beers, km) {
        if (km !== 0) {
            return round(beers / km, 2);
        }
        return '&infin;';
    }


    function print(dates, element) {
        var template = _.template($('#table_row_template').html());
        var els =  _.map(dates, function (done, day) {
            return template({
                date: moment(day).format('MMMM YYYY'),
                numBeers: done.beers,
                kmRun: round(done.km_run, 2),
                bpk: bpk(done.beers, done.km_run)
            });
        });
        element.append(els);
    }

    ns.printList = function (dict, element) {
        print(aggregate(dict, 'YYYY-MM'), element);
    };


}(BK));
