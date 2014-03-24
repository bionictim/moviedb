
App.ViewModel.Info = App.Class.define(function (options) {
    this.programs = options.programs;
    this.tags = options.tags;
    this.programsByMajorGenre = options.programsByMajorGenre;
    this.categoriesViewModel = new App.ViewModel.Categories({
        categories: options.categories,
        programs: options.programs
    });
});