
App.Service.Data = App.Class.define(function (options) {
    this.programDataUrl = options.programDataUrl;
}, {
    getCategories: function () {
        var deferred = $.Deferred();
        deferred.resolve(new App.Model.Categories());
        return deferred.promise();
    },

    getPrograms: function (programData) {
        var deferred = $.Deferred();

        $.ajax(this.programDataUrl + "?__v=" + (new Date()).getMilliseconds(), {
            dataType: "json",
            success: function (data) {
                var programs = _.map(data, function (program) {
                    return new App.Model.Program(program);
                });
                programs = _.reject(programs, function (movie) { return (movie.Genre.indexOf("horror") < 0 && -1 == $.inArray("horror", movie.TagsArray)) || movie.Title.indexOf("Daruma") > -1 || movie.Title == "Baise Moi" || movie.Title.indexOf("Entrails of") > -1 || movie.Title.indexOf("Torture (aka") > -1 })
                programs = _.sortBy(programs, function (program) {
                    return program.Title;
                });

                deferred.resolve(programs);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                deferred.reject(jqXHR, textStatus, errorThrown);
            }
        });

        return deferred.promise();
    },

    // Since we don't have a repository to lazy-load programs, let's take programs as a parameter & make this synchronous for now.
    getTags: function (programs) {
        var hash = {};
        _.each(programs, function (program) {
            _.each(program.TagsArray, function (tag) {
                hash[tag] = (hash[tag] || 0) + 1;
            });
        });

        var result = [];
        _.each(_.keys(hash), function(key){
            result.push({
                tag: key,
                count: hash[key]
            });
        });

        result = _.sortBy(result, function (tagObj) {
            return -tagObj.count; // Negative sign will sort descending.
        });

        return result;
    }
});