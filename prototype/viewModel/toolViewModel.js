
App.ViewModel.Tool = App.Class.define(function (options) {
    this.programs = options.programs;
    this.tags = options.tags;
    this.categoriesViewModel = new App.ViewModel.Categories({
        categories: options.categories,
        programs: options.programs,
        isNavigator: true
    });
    this.programsByMajorGenre = _.groupBy(options.programs, function (program) {
        return program.Genre;
    });
}, {
    getProgramLists: function (criteria, groupBy, limitGroupsToCriteria) {
        return App.ViewModel.ProgramList.getLists(this.programs, criteria, groupBy, limitGroupsToCriteria);
    }
});