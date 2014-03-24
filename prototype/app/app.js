window.App = {};

App.Controller = {};
App.Model = {};
App.ViewModel = {};
App.Service = {};

$.whenall = function (arr) {
    return $.when.apply($, arr).pipe(function () {
        return Array.prototype.slice.call(arguments);
    });
};

App.Main = (function () {

    var config = {
        templateBaseUri: "templates/",
        version: "1.00.00049",
        programDataUrl: "../data/data.json.txt?__v=" + (new Date()).getMilliseconds()
    };

    var _m = {
        services: {
            data: null
        },
        controllers: {
            nav: null,
            tool: null,
            info: null
        },
        cache: {
            categories: null,
            programs: null,
            tags: null
        }
    };

    var load = function () {
        var deferred = $.Deferred();

        $.whenall([
            _m.services.data.getCategories(),
            _m.services.data.getPrograms()
        ]).done(function (resultsArr) {
            _m.cache.categories = resultsArr[0];
            _m.cache.programs = resultsArr[1];
            _m.cache.tags = _m.services.data.getTags(_m.cache.programs);
            deferred.resolve();
        });

        return deferred.promise();
    }

    var init = function () {
        _m.services.data = new App.Service.Data({
            programDataUrl: config.programDataUrl
        });

        // Controllers not initialized with service-dependent data.
        _m.controllers.nav = new App.Controller.Nav(".nav-view");

        // Controllers initialized with service-dependent data.
        load().then(function () {
            _m.controllers.info = new App.Controller.Info(".nav-section[data-section='info']", {
                viewName: "info",
                model: new App.ViewModel.Info({
                    categories: _m.cache.categories,
                    programs: _m.cache.programs,
                    tags: _m.cache.tags
                })
            });

            _m.controllers.tool = new App.Controller.Tool(".nav-section[data-section='tool']", {
                viewName: "tool",
                model: new App.ViewModel.Tool({
                    categories: _m.cache.categories,
                    programs: _m.cache.programs,
                    tags: _m.cache.tags
                })
            });
        });
    }

    return {
        init: init,
        config: config,
        controllers: _m.controllers,
        cache: _m.cache
    };
})();