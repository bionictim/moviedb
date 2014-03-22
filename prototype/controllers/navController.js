
App.Controller.Nav = App.Class.derive(App.Controller.Base, function (container, options) {
    App.Controller.Nav.superproto.constructor.call(this, container, options);
    
    this.$navItems = this.$container.find(".nav-item");
    this.$navSections = $(".nav-section");

    var $defaultSection = this.$navSections.eq(0);
    this.showSection($defaultSection.data("section"));
    this.bindEventsOnce();
}, {
    bindEventsOnce: function () {
        App.Controller.Nav.superproto.bindEventsOnce.call();
        console.log("App.Controller.Nav.bindEventsOnce()");

        var self = this;
        this.$navItems.on("click", function (e) {
            e.preventDefault();
            self.showSection($(this).data("section"));
        });
    },

    showSection: function (section) {
        this.$navSections.hide();
        this.$navSections.closest("[data-section='" + section + "']").show();
    }
});