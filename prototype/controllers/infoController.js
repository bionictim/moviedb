
App.Controller.Info = App.Class.derive(App.Controller.Base, function (container, options) {
    App.Controller.Nav.superproto.constructor.call(this, container, options);
    

    this.bindEventsOnce();
}, {
    bindEventsOnce: function () {
    }


});