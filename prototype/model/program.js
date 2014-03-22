
App.Model.Program = App.Class.define(function (options) {
    for (var key in options)
        this[key] = options[key];

    var self = this;
    _.each(["Tags", "Categories", "Subcategories"], function (prop) {
        self[prop + "Array"] = self.parseToArray(self[prop]);
    });
}, {
    parseToArray: function (delimitedString) {
        var arr = (delimitedString || "").split(",");
        var result = [];
        _.each(arr, function (item) {
            item = item.trim();
            if (!!item)
                result.push(item);
        });

        return result;
    }
}, {
});