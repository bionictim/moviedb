
App.ViewModel.Info = App.Class.define(function (options) {
    this.programs = options.programs;
    this.tags = options.tags;
    this.categoriesViewModel = new App.ViewModel.Categories({
        categories: options.categories,
        programs: options.programs
    });
    this.programsByMajorGenre = _.groupBy(this.programs, function (program) {
        return program.Genre;
    });
});