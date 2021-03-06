﻿
App.ViewModel.ProgramList = App.Class.define(function (options) {
    this.title = options.title;
    this.programs = options.programs;
}, {
}, {
    getLists: function (programs, criteria, groupBy, limitGroupsToCriteria) {
        var result = [];
        var filtered = _.filter(programs, function (program) {
            for (var i = 0, len = criteria.length; i < len; i++) {
                var array = (criteria[i].type === "Genre") ?
                    [ program.Genre ] :
                    program[criteria[i].type + "Array"];

                if (!!array && _.contains(array, criteria[i].value)) {
                    return true;
                }
            }

            return false;
        });

        if (!!groupBy) {
            var groupProperty = (groupBy === "Genre") ? "Genre" : groupBy + "Array";        
            var groups;

            if (!!limitGroupsToCriteria) {
                groups = _.pluck(_.filter(criteria, function (c) {
                    return c.type === groupBy;
                }), "value");
            } else {
                if (groupBy === "Categories") {
                    groups = _.keys(App.Main.cache.categories);
                } else if (groupBy === "Genre") {
                    groups = _.keys(App.Main.cache.programsByMajorGenre);
                } else {
                    groups = [];
                    _.each(App.Main.cache.categories, function (cat) {
                        groups = groups.concat(cat);
                    });
                }
            }

            _.each(groups, function (group) {
                var grouped = _.filter(filtered, function (program) {
                    if (groupProperty === "Genre")
                        return program[groupProperty] === group;

                    return _.contains(program[groupProperty], group);
                });

                grouped = _.sortBy(grouped, function(movie) {
                    return movie.Title;
                });

                if (grouped.length > 0) {
                    result.push(new App.ViewModel.ProgramList({
                        title: group,
                        programs: grouped
                    }));
                }
            });
        } else {
            result.push(new App.ViewModel.ProgramList({
                title: "",
                programs: filtered
            }));
        }

        return result;

    }
});