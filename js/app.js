$(function() {
	sessionStorage.setItem('success', 'no');
});

window.app = {};

window.app.utils = {
	toggleEditMode: function (editable, $form) {
		var $form = $form || $("form").eq(0);
		var $inputs = $form.find("input[type='text'], textarea, input[type='date'], input[type='number']");
		
		$inputs.toggleClass("ui-disabled", !editable);
	},

	getSqlUpdateFromForm: function (tableName, $form, id) {
		// TODO: Dropdowns, checkboxes, radio buttons
		//
		var $form = $form || $("form").eq(0);
		var $inputs = $form.find("input[type='text'], textarea, input[type='date'], input[type='number']");		
		var names = [];
		var values = [];
		
		$inputs.each(function(i, obj){
			var $input = $(obj);
			names.push($input[0].name);
			values.push($input.val());
		});
		
		var update = !!id;
		var result;
		
		if (update) {
			var kvps = [];
			$.each(names, function(i){
				kvps.push(names[i] + "='" + values[i] + "'");
			});
			kvpList = kvps.join(",");
			result = "UPDATE " + tableName + " SET " + kvpList + " WHERE Id=" + id + ";";
		} else {
			var columnList = "(" + names.join(",") + ")";
			var valueList = "('" + values.join("','") + "')";
			result = "INSERT INTO " + tableName + " " + columnList + " VALUES " + valueList + ";";
		}	
		
		return result;
	},
	
	runSqlFromFile: function(fileName, splitByLine, onSuccess, onError){
		app.utils.openDatabase();
		
		$.get(fileName,function(sqlStatements) {				
			html5sql.process(
				(!!splitByLine) ? sqlStatements.split("\n") : sqlStatements,
				onSuccess || function(){

				},
				onError || function(error, statement){
					console.error("Error: " + error.message + " when processing " + statement);
				}
			);
		});
			
		
		html5sql.logInfo = true;
		html5sql.logErrors = true;
		html5sql.putSelectResultsInArray = true;
	},
	
	openDatabase: function() {
		if (!html5sql.database) {
			html5sql.openDatabase("com.tsl.moviedb", "App Data", 5*1024*1024);
		}
	},
	
	runDbSetup: function (onSuccess, onError) {
		app.utils.runSqlFromFile('setup.sql.txt', false, onSuccess, onError);
	}
};

window.app.views = {

	main: function() {
	
		$("#main_screen").on('pageinit', function() {
			if (!html5sql.database) {
				// TODO: Check if database table exists???
				//
				app.utils.runDbSetup();
			}
			
			$("#addMovie").on("click", function(e){
				sessionStorage.setItem("selectedRow", "");
			});
			
			$("#importData").on("click", function(e) {
				e.preventDefault();
				
				if (confirm("Are you sure you want to overwrite your data and import?")) {
					html5sql.process(
						"DROP TABLE Movies",
						function(){
							app.utils.runDbSetup(function () {
								app.utils.runSqlFromFile('import.sql.txt', true);
							});
						},
						function(error, statement){
							console.error("Error: " + error.message + " when processing " + statement);
						}
					);
				}
			});
		});


		$('#main_screen').on('pageshow', function(event, ui) {			
			if (sessionStorage.getItem('success') == 'yes' ) {
				alert('Movie added sucessfully');
				sessionStorage.setItem('success', 'no');
			}
		});

	},

	newMovie: function() {

		$("#new_movie").on('pageinit', function() {

			var $page = $(this);
			var $form = $("form");
			
			$page.attr("data-mode", "editing");
			
			$form.find(".cancel").on("click", function(e) {
				e.preventDefault();
				$form.find("input[type='text'], textarea, input[type='date'], input[type='number']").val("");
				$page.attr("data-mode", "editing");
				$.mobile.changePage("index.html");
			});

			$form.submit(function(event) {
			
				event.stopPropagation();
				event.preventDefault();

				var first_name = $('#first_name').val();
				var last_name = $('#last_name').val();
				var age = $('#age').val();
				var money = $('#money').val();
				
				// TODO: Check if updating
				//
				var isUpdating = ($page.data("mode") === "updating");
				var movieId = sessionStorage.getItem('selectedRow'); // Empty if not updating
				var sql = app.utils.getSqlUpdateFromForm("Movies", $(this), movieId);

				html5sql.process(
					[ sql ],
					function(){
						
						// success flag using session storage
						// useful becuase index.html can display a nice message to use on success
						
						sessionStorage.setItem('success', 'yes');
						
						$.mobile.changePage("index.html");
						
					},
					function(error, statement) {
						console.error("Error: " + error.message + " when processing " + statement);
						alert(error.message);
					}        
				);

				return false;
			});			
			
			$page.find(".enable-editing").on("click", function(e) {
				e.preventDefault();
				app.utils.toggleEditMode(true);
				$page.attr("data-mode", "updating");
			});
		});
		
		$('#new_movie').on('pagebeforeshow', function(event, ui) {
			var $page = $(this);
			var movieId = sessionStorage.getItem('selectedRow');
			
			if (!!movieId) {
				app.utils.toggleEditMode(false);
				$page.attr("data-mode", "readonly");
			
				html5sql.process(["SELECT * FROM Movies WHERE Id='" + movieId + "';"],
					function(transaction, results, rowArray){
						$.each(rowArray[0], function (key, val) {
							var $input = $page.find("[name='" + key + "']");
							
							if ($input.length > 0)
								$input.val(val);
						});
					}, function() {
					
					}
				);
				
			}
		});
	},
	
	savedMovies: function() {
	
		$("#saved_movies").on('pageinit', function() {

			html5sql.putSelectResultsInArray = true;
			html5sql.process(
				[
					"SELECT * FROM Movies ORDER BY DateWatched DESC"
				],
				function(transaction, results, rowArray) {
				
					var html = '';

					$.each(rowArray, function(index, value) { 
					
					  html += "<li><a href=\"new_movie.html\" class=\"ui-link-inherit movie-link\" data-movieid='" + value.Id + "'>" + 
						//value.DateWatched + ": " + 
						value.Title + " (" + value.ReleaseYear + ")</a></li>";
					  
					});
					
					html += '</ul>';
					
					$('#movie_list').append(html);
					$('#movie_list').listview('refresh');
					
					$('#movie_list .movie-link').on("click", function (e) {
						sessionStorage.setItem('selectedRow', $(this).data("movieid"))
					});
					
				},
				function(error, statement){
					console.error("Error: " + error.message + " when processing " + statement);
				}        
			);

		});
	}
	
}
