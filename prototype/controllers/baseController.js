App.Controller = {};

App.Controller.Base = App.Class.define(function (container, options) {
    // Constructor
    options = options || {};
    this.model = null;
    this.viewName = options.viewName;
    this.autoRender = options.autoRender === false ? false : true;
    this.$container = $(container); // jQuery selection or DOM element or CSS selector
    //this.bindEventsOnce();

    if (options.model)
        this.setModel(options.model);
}, {
    // Instance Members
    setModel: function (model) {
        this.model = model;

        if (this.autoRender)
            this.render();
    },

    render: function (opt_model) {
        console.log("App.Controller.render()");
        this.model = opt_model || this.model;

        if (!!this.viewName && !!this.model) {
            var html = App.Controller.Base.renderHtml(this.viewName, this.model);
            this.$container.html(html);
        }

        this.afterRender();
    },

    bindEventsOnce: function () {
        console.log("App.Controller.bindEventsOnce()");
        // Override. Example: 
        /*
        this.$container.on("click", "button", function(e) {
            console.log("clicked");
        });
        */
    },

    afterRender: function () {
        console.log("App.Controller.afterRender()");
        // Override, for selecting items rendered. Example:
        /*
        this.$container
            .find("button[name='special']")
            .on("click", function(e) {
                this.$container.find(".something-else").html("I changed");
            });    
        */
    }
}, {
    // Static Members
    renderHtml: function (viewName, model) {
        var result = new EJS({
            url: App.Controller.Base.getTemplateUri(viewName)
        }).render(model);

        return result;
    },

    getTemplateUri: function (viewName) {
        return App.Main.config.templateBaseUri + viewName + ".html?__v=" + App.Main.config.version;
    }
});
