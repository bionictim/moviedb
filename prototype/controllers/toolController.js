
App.Controller.Tool = App.Class.derive(App.Controller.Base, function (container, options) {
    this.controllers = {
        programBrowser: null
    };

    App.Controller.Tool.superproto.constructor.call(this, container, options);

    this.$groupBy = this.$container.find(".tool-nav select[name='GroupBy']");
    this.$showOnlySelected = this.$container.find(".tool-nav input[name='ShowOnlySelected']");
    this.$navItems = this.$container.find(".tool-nav li > a");
    this.$checkboxes = this.$container.find(".tool-nav li > input[type='checkbox']");
    this.$content = this.$container.find(".tool-content");

    this.bindEventsOnce();
}, {
    bindEventsOnce: function () {
        App.Controller.Tool.superproto.bindEventsOnce.call();
        console.log("App.Controller.Tool.bindEventsOnce()");

        var self = this;

        this.$groupBy.on("change", function (e) {
            self.captureInput();
        });

        this.$showOnlySelected.on("change", function (e) {
            self.captureInput();
        });

        this.$navItems.on("click", function (e) {
            e.preventDefault();
            self.captureInput(this);
        });

        this.$checkboxes.on("change", function (e) {
            var el = ($(this).is(":checked")) ? el : null;
            self.captureInput(el);
        });
    },

    afterRender: function () {
        this.controllers.programBrowser = new App.Controller.ProgramBrowser(".nav-section[data-section='tool'] .tool-content", {
            viewName: "programBrowser"
        })
    },

    clearAll: function () {
        this.$checkboxes.attr("checked", false);
    },

    select: function (type, value) {
        this.$checkboxes
            .filter("[data-navtype='" + type + "'][data-navvalue='" + value + "']")
            .prop("checked", true);
    },

    captureInput: function (el) {
        if (!!el) {
            var $item = $(el);
            var type = $item.data("navtype"),
                value = $item.data("navvalue");

            if (!!type && !!value) {
                if ($item.data("singlevalue"))
                    this.clearAll();

                this.select(type, value);
            }
        }

        this.updateProgramBrowser();
    },

    updateProgramBrowser: function () {
        var $checked = this.$container.find(".tool-nav li > input[type='checkbox']:checked");
        var criteria = [];

        $checked.each(function (i, o) {
            var $item = $(o);
            criteria.push({
                type: $item.data("navtype"),
                value: $item.data("navvalue")
            });
        });

        var groupBy = this.$groupBy.val();
        var programLists = this.model.getProgramLists(criteria, groupBy, this.$showOnlySelected.is(":checked"));
        console.log(programLists);

        this.controllers.programBrowser.setModel(new App.ViewModel.ProgramBrowser({
            programLists: programLists
        }));
    }
});