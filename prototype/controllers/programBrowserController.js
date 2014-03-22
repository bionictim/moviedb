
App.Controller.ProgramBrowser = App.Class.derive(App.Controller.Base, function (container, options) {
    App.Controller.Tool.superproto.constructor.call(this, container, options);
  
    this.bindEventsOnce();
}, {
    afterRender: function () {
        $(".program").hover(function (e) {
            $(this).attr("data-flyout-visible", "true");
        }, function (e) {
            $(this).attr("data-flyout-visible", "false");
        });
    }
});