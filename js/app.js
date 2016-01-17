window.app = {};


// Utils
//
window.app.utils = {
	Consts: {
		formInputSelector: "input[type='text'], textarea, input[type='date'], input[type='number'], button",
		displayRatingsAsStars: false
	},

	toggleEditMode: function (editable, $form) {
		var $form = $form || $("form").eq(0);
		var $inputs = $form.find(app.utils.Consts.formInputSelector);
		
		$inputs.toggleClass("ui-disabled", !editable);
	},
	
	clearForm: function ($form) {
		var $form = $form || $("form").eq(0);
		$form.find(app.utils.Consts.formInputSelector).val("");
	},

	getSqlUpdateFromForm: function (tableName, $form, id) {
		// TODO: Dropdowns, checkboxes, radio buttons
		//
		var $form = $form || $("form").eq(0);
		var $inputs = $form.find(app.utils.Consts.formInputSelector);		
		var row = {};
		var blacklist = [""];
		
		$inputs.each(function(i, obj){
			var $input = $(obj);
			if ($input[0].type !== "submit")
				row[$input[0].name] = $input.val();
		});
		
		return app.utils.getSqlUpdateFromRow (tableName, row, id);
	},
	
	getSqlUpdateFromRow: function (tableName, row, id) {
		var update = !!id;
		var names = [];
		var values = [];
		
		for (var key in row) {
			if (update || key !== "Id") { // Don't include the Id field if we're inserting. (For bulk import of backup data)
				names.push(key);
				values.push(row[key]);
			}
		}
		
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
	},
	
	getDataUri: function (data) {
		if (typeof data == "object")
			data = JSON.stringify(data);
			
		var url = "data:application/octet-stream;base64," + Base64.encode(data);
		
		return url;
	},
	
	downloadUrl: function(url) {
		var iframe;
		iframe = document.getElementById("hiddenDownloader");
		if (iframe === null)
		{
			iframe = document.createElement('iframe');  
			iframe.id = "hiddenDownloader";
			iframe.style.display = "none";
			document.body.appendChild(iframe);
		}
		iframe.src = url;   
	},
	
	saveJSON: function (obj) {
		var json = JSON.stringify(obj);
		window.open( "data:text/json;charset=utf-8," + escape(json));
	},
	
	exportData: function (onSuccess) {
		html5sql.process(["SELECT * FROM Movies;"],
			function(transaction, results, rowArray) {
			
				onSuccess = onSuccess || function() {};
			
				$.ajax({
					url: "save.njs",
					type: "POST",
					data: JSON.stringify(rowArray),
					success: function(data, textStatus, jqXHR ) {
						console.log(data);
						onSuccess();
					},
					error: function(jqXHR, textStatus, errorThrown) {
						console.log("Error: " + textStatus + ", " + errorThrown);
					}
				});
			
				//app.utils.saveJSON(rowArray);
			
				/*
				var url = app.utils.getDataUri(rowArray);
				app.utils.downloadUrl(url);
				*/
				
				/*
				var rowsToJson = JSON.stringify(rowArray);
				 
				window.URL = window.URL || window.webkitURL;						
				
				//var blob = new Blob([rowsToJson], {'type':'application\/json'});
				
				var blob = new NewBlob(rowsToJson, "application\/json");
				blob = blob.blob;
				
				var a = document.createElement('a');
				a.href = window.URL.createObjectURL(blob);
				
				console.log(a.href);
				
				a.download = "movies-" + new Date() + ".json";
				a.click();
				*/
				
				
			}, function() {
			
			}
		);
	},

	importData: function(onSuccess, onError) {
		//if (confirm("Are you sure you want to overwrite your data and import?")) {				
			html5sql.process(
				"DROP TABLE Movies",
				function(){
					app.utils.runDbSetup(function () {
						//app.utils.runSqlFromFile('import.sql.txt', true);
						
						$.get("data/data.json.txt?__v=" + (new Date()).getMilliseconds(), function(json) {
							var data = JSON.parse(json);
							var statements = [];
							
							$.each(data, function (i, row) {
								statements.push(app.utils.getSqlUpdateFromRow("Movies", row));										
							});
							
							html5sql.process(
								statements,
								function() {
									app.views.renderSavedMovies();
									//alert("Imported data.");
									app.utils.toast("Imported data.");
									console.log("Successfully imported data");
									if (onSuccess) onSuccess();									
								},
								function(error, statement){
									console.error("Error: " + error.message + " when processing " + statement);
									if (onError) onError(error, statement);
								}
							);
						});
						
					});
				},
				function(error, statement){
					console.error("Error: " + error.message + " when processing " + statement);
				}
			);
		//}
	},

	getCsv: function (onSuccess) {
		onSuccess = onSuccess || function() {};

		html5sql.process(["SELECT * FROM Movies;"],
			function(transaction, results, rowArray) {			
				var csv = "";
		
				rowArray.forEach(function (row, i) {
					var csvRow = "";
					for (var col in row) {
						var val = "" + (row[col] || "");
						csvRow += ('"' + val.replace(/"/g, '""') + '",');
					};
					csvRow = csvRow.substring(0, csvRow.length - 1);
					csv += csvRow;
					csv += "\r\n";
				});

				onSuccess(csv);
				//window.open("data:text/csv;charset=utf-8," + escape(csv));				
			}, function() {
			
			}
		);
	},

	downloadWithName: function (uri, name) {

	    function eventFire(el, etype){
	        if (el.fireEvent) {
	            (el.fireEvent('on' + etype));
	        } else {
	            var evObj = document.createEvent('Events');
	            evObj.initEvent(etype, true, false);
	            el.dispatchEvent(evObj);
	        }
	    }

	    var link = document.createElement("a");
	    link.download = name;
	    link.href = uri;
	    eventFire(link, "click");

	},

 	toast: function(msg) {
		$("<div class='ui-loader ui-overlay-shadow ui-body-e ui-corner-all'><h3>"+msg+"</h3></div>")
		.css({ display: "block", 
			opacity: 0.90, 
			position: "fixed",
			padding: "7px",
			"text-align": "center",
			width: "270px",
			left: ($(window).width() - 284)/2,
			top: $(window).height()/2 })
		.appendTo( $.mobile.pageContainer ).delay( 1500 )
		.fadeOut( 400, function(){
			$(this).remove();
		});
	},

	fetchMovieSearchData: function (movieTitle) {
		var deferred = $.Deferred();

		var url = "http://api.themoviedb.org/3/search/movie?api_key=04648b4bb8120607e0a82c88196d0d0c&query={0}";

		$.ajax({
			url: url.replace("{0}", encodeURIComponent(movieTitle)),
			type: "GET",
			success: function (data, textStatus, jqXHR) {
				deferred.resolve(data);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				console.log("Error: " + textStatus + ", " + errorThrown);
				deferred.reject(jqXHR, textStatus, errorThrown);
		  	}
		});

		return deferred.promise();
	},

	fetchMovieDetailsData: function (tmdbMovieId) {
		var deferred = $.Deferred();

		var url = "http://api.themoviedb.org/3/movie/{0}?api_key=04648b4bb8120607e0a82c88196d0d0c";

		$.ajax({
			url: url.replace("{0}", encodeURIComponent(tmdbMovieId)),
			type: "GET",
			success: function (data, textStatus, jqXHR) {
				deferred.resolve(data);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				console.log("Error: " + textStatus + ", " + errorThrown);
				deferred.reject(jqXHR, textStatus, errorThrown);
		  	}
		});

		return deferred.promise();
	},

	fetchMovieCreditsData: function (tmdbMovieId) {
		var deferred = $.Deferred();

		var url = "http://api.themoviedb.org/3/movie/{0}/credits?api_key=04648b4bb8120607e0a82c88196d0d0c";

		$.ajax({
			url: url.replace("{0}", encodeURIComponent(tmdbMovieId)),
			type: "GET",
			success: function (data, textStatus, jqXHR) {
				deferred.resolve(data);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				console.log("Error: " + textStatus + ", " + errorThrown);
				deferred.reject(jqXHR, textStatus, errorThrown);
		  	}
		});

		return deferred.promise();
	}
};

var NewBlob = function(data, datatype) {
    var out;

    try {
        out = new Blob([data], {type: datatype});
        console.debug("case 1");
    }
    catch (e) {
        window.BlobBuilder = window.BlobBuilder ||
                window.WebKitBlobBuilder ||
                window.MozBlobBuilder ||
                window.MSBlobBuilder;

        if (e.name == 'TypeError' && window.BlobBuilder) {
            var bb = new BlobBuilder();
            bb.append(data);
            out = bb.getBlob(datatype);
            console.debug("case 2");
        }
        else if (e.name == "InvalidStateError") {
            // InvalidStateError (tested on FF13 WinXP)
            out = new Blob([data], {type: datatype});
            console.debug("case 3");
        }
        else {
            // We're screwed, blob constructor unsupported entirely   
            console.debug("Errore");
        }
    }
	
	this.blob = out;
}


// Init
//
$(function() {
	sessionStorage.setItem('success', 'no');
});

$(document).bind("mobileinit", function(){
	$.support.touchOverflow = true;
	$.mobile.touchOverflowEnabled = true;
});


// View controllers
//
window.app.views = {

	main: function() {
	
		$("#main_screen").on('pageinit', function() {
			if (!html5sql.database) {

				var importData = function() {
					app.utils.importData(
						function() {},
						function(err, statement) {}
					);
				};

				// TODO: Check if database table exists???
				//
				app.utils.runDbSetup(function(arg1, arg2) { // not sure of signature
					importData();
				}, function(arg1, arg2) {
					importData();
				});

			}
			
			$("#addMovie").on("click", function(e){
				sessionStorage.setItem("selectedRow", "");
			});
			
		});


		$('#main_screen').on('pageshow', function(event, ui) {			
			if (sessionStorage.getItem('success') == 'yes' ) {
				//alert('Movie added sucessfully');
				sessionStorage.setItem('success', 'no');
			}
		});

	},

	newMovie: function() {

		$("#new_movie").on('pageinit', function() {

			var $page = $(this);
			var $form = $("form");
			var $popup = $("#selectMovie");
			var $template = $popup.find(".template");
			var $list = $popup.find("ul");

			$template.removeClass("template");
			
			$page.attr("data-mode", "editing");
			
			$form.find(".cancel").on("click", function(e) {
				e.preventDefault();
				app.utils.clearForm();
				$.mobile.changePage("index.html");
			});

			$form.find("[name='loadFromService']").on("click", function(e) {
				e.preventDefault();
				var title = $("[name='Title']").val();

				if (!!title) {
					app.utils.fetchMovieSearchData(title).then(function (data) {
						console.log(data);

						if (!!data && !!data.results && data.results.length > 0) {
							
							$list.html("");
							var basePosterPath = "http://image.tmdb.org/t/p/w185";

							data.results.forEach(function (movie) {
								var $item = $template.clone();
								
								if (!!movie.poster_path)
									$item.find("img").attr("src", basePosterPath + movie.poster_path);

								$item.find("h2").html(movie.title);
								$item.find("p").html(movie.release_date);
								$item.find("a").attr("data-movie", escape(JSON.stringify(movie)));
								$list.append($item);
							});

							$popup.popup("open");
						}

					}).fail(function(jqXHR, textStatus, errorThrown) {

					});
				}
			});

			$popup.on("click", "a", function(e) {
				e.preventDefault();
				var movie = JSON.parse(unescape($(this).data("movie")));

				$form.find("[name='Title']").val(movie.title);
				$form.find("[name='ReleaseYear']").val(new Date(movie.release_date).getFullYear());
				$form.find("[name='TmdbPosterPath']").val(movie.poster_path);

				app.utils.fetchMovieDetailsData(movie.id).then(function (data) {
					if (!!data && !!data.genres && data.genres.length > 0) {
						var genres = $.map(data.genres, function (genre) {
							return genre.name.toLowerCase();
						});

						if (genres.length) {
							var $tagInput = $form.find("[name='Tags']");
							var tagInputVal = $tagInput.val();

							if (!!tagInputVal)
								genres.push(tagInputVal);

							var tags = genres.join(", ");

							$tagInput.val(tags);
						}
					}
				}).then(function() {
					return app.utils.fetchMovieCreditsData(movie.id);
				}).then(function (data) {
					if (!!data && !!data.crew && data.crew.length > 0) {
						var directors = $.grep(data.crew, function (credit) {
							return credit.job === "Director";
						});

						var names = $.map(directors, function (member) {
							return member.name;
						});

						var directorsVal = names.join(", ");

						$form.find("[name='Director']").val(directorsVal);
					}
					console.log(data);
				}).done(function () {
					$popup.popup("close");
				}).fail(function (jqXHR, textStatus, errorThrown) {
				});
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
					function() {						
						// success flag using session storage
						// useful becuase index.html can display a nice message to use on success						
						sessionStorage.setItem('success', 'yes');
						sessionStorage.setItem('refreshSavedMovies', true);

						if ("" + localStorage["exportOnEachSave"] == "true") {
							app.utils.exportData(function() {
								$.mobile.changePage("index.html");
							});
						} else {
							$.mobile.changePage("index.html");
						}			
						
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
			} else {
				$page.attr("data-mode", "editing");
			}
		});
	},
	
	savedMovies: function() {
	
		$("#saved_movies").on('pageinit', function() {
			app.views.renderSavedMovies();
		});
		
		$("#saved_movies").on('pagebeforeshow', function() {
			if ("" + sessionStorage.getItem('refreshSavedMovies') == "true") {
				app.views.renderSavedMovies();
				sessionStorage.setItem('refreshSavedMovies', false);
			}
		});
	},
	
	renderSavedMovies: function (model) {
		model = model || {
			parentalFilter: (localStorage["parentalFilter"] || 10)
		};

		var parseStoredDate = function (storedDateString) {
			var parts = storedDateString.split("-");
			if (parts.length === 3) {
				return new Date("" + parts[1] + "/" + parts[2] + "/" + parts[0]);
			} else {
				return new Date(storedDateString);
			}
		};

		var getStarsHtml = function (rating) {
			var result = '<p class="star-rating ui-li-desc" title="gorgeous">';

			for (var i = 1; i <= 10; i++) {
				result += ('<i data-alt="' + i + '" class="star-' + (i <= rating ? "on" : "off") + '-png" title="gorgeous"></i>&nbsp;');
			}

			result += '</p>';

			return result;
		};
	
		html5sql.putSelectResultsInArray = true;
		html5sql.process(
			[
				"SELECT * FROM Movies WHERE Inaccessibility <= " + model.parentalFilter + " OR Inaccessibility = '' ORDER BY DateWatched DESC, Id DESC;"
			],
			function(transaction, results, rowArray) {
			
				var html = '';
				var basePosterPath = "http://image.tmdb.org/t/p/w185";

				$.each(rowArray, function(index, value) {
					var imgUrl = value.TmdbPosterPath;
					if (imgUrl)
						imgUrl = basePosterPath + imgUrl;

					var newRow = "" +
						"<li data-rating='" + value.Rating + "'>" + 
							"<a href='new_movie.html' class='ui-link-inherit movie-link' " + 
								"data-movieid='" + value.Id + "' " +
								"data-rel='dialog' data-transition='pop'>" +
									"<img src='" + imgUrl + "' />" +
									"<h2>" + value.Title + " (" + value.ReleaseYear + ")" + "</h2>" +
									"<p>" + parseStoredDate(value.DateWatched).toLocaleDateString() + "</p>" +
									(app.utils.Consts.displayRatingsAsStars ?
										getStarsHtml(value.Rating) : 
										"<p>" + value.Rating + " / 10</p>")
							"</a>" +
						"</li>";
					html += newRow;
				});
				
				$('#movie_list').html(html);
				$('#movie_list').listview('refresh');
				
				$('#movie_list .movie-link').on("click", function (e) {
					sessionStorage.setItem('selectedRow', $(this).data("movieid"))
				});
				
				if (app.utils.Consts.displayRatingsAsStars) {
					$('#movie_list li').each(function (i, o) {
						var $item = $(o);
						var rating = $item.data("rating");
						var ratyArgs = {
							score: rating,
							number: 10,
							readOnly: true,
							path: "../bower_components/raty/lib/images",
							starType: "i"
						};
						var $starRating = $(o).find(".star-rating");
						var deferTime = (i <= 20) ? 0 :
							(i <= 100) ? 3000 :
							(i <= 500) ? 7000 :
							10000;

						if (deferTime < 0)
							setTimeout(function () {
								$starRating.raty(ratyArgs);
							}, deferTime);
					});
				}
			},
			function(error, statement){
				console.error("Error: " + error.message + " when processing " + statement);
			}        
		);
	},
	
	settingsInputs: [{
		key: "parentalFilter",
		def: 10,
		onchange: function() {
			sessionStorage.setItem('refreshSavedMovies', true);
		}
	}, {
		key: "exportOnEachSave",
		def: false
	}],
	
	settings: function() {
		$("#tools").on('pageinit', function() {
		
			var bind = function(inputs) {
				$.each(inputs, function (i, input) {
					var selector = "#" + input.key;
					var $input = $(selector);
					
					// localStorage is our model.
					localStorage[input.key] = localStorage[input.key] || input.def;					
					$input.val(localStorage[input.key]);
					
					$input.on("change", function (e) {
						localStorage[input.key] = $(this).val();
						
						if (!!input.onchange)
							input.onchange(e);
					});
				});
			};
			
			bind(app.views.settingsInputs);
		
			$("#importData").on("click", function (e) {
				e.preventDefault();				
				app.utils.importData(function() {}, function(err, statement) {});
			});

			$("#exportData").on("click", function (e) {
				e.preventDefault();
				app.utils.exportData(function () {
					alert("Data exported.");
				});
			});

			$("#downloadCsv").on("click", function (e) {
				e.preventDefault();
				var $link = $(this);
				
				app.utils.getCsv(function (csv) {
					$link.attr("href", "data:application/csv;charset=utf-8," + encodeURIComponent(csv));
					
					app.utils.downloadWithName($link.attr("href"), "movies.csv");
					//window.location.href = $link.attr("href");
				});
			});
			
			$("#test").on("click", function(e) {
				e.preventDefault();
				
				$.ajax({
					url: "save.njs",
					type: "POST",
					data: JSON.stringify({
						field1: "THis is field 1",
						field2: [
							"I",
							"like",
							"cheese"
						]
					}),
					success: function(data, textStatus, jqXHR ) {
						console.log(data);
					},
					error: function(jqXHR, textStatus, errorThrown) {
						console.log("Error: " + textStatus + ", " + errorThrown);
					}
				});
			});
		});
		
		$("#tools").on('pagebeforeshow', function() {
			$("#exportOnEachSave").slider("refresh");
		});
	},


	
}
