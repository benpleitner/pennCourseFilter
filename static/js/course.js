var token = "public";
var base = "http://api.penncoursereview.com/v1/";

//Angular
(function() {
  var app = angular.module("courseRatings", []);

  app.controller("RatingController", function(){
    this.rating = 2;

    this.setRating = function(value){
      this.rating = value;
    };

    this.isSet = function(value){
      return this.rating === value;
    };
  });
})();

d3.json(base + amplify.store("coursePath") + "/?token=" + token, function(error, rawData) {
	//Write the course name to the html page
	var courseName = rawData.result.aliases[0].split("-");
	document.getElementById("header").innerHTML = courseName[0] + " " + courseName[1];

	var coursePathArray = [],
			semesterArray = [],
			semesterNumArray = [],
			forCharts = [];

	//Iterate through each semester
	for (var i = 0; i < rawData.result.courses.length; i++) {
		// coursePathArray[i] = rawData.result.courses[i].path;

		var year = rawData.result.courses[i].semester.substring(0, rawData.result.courses[i].semester.length - 1),
				season = rawData.result.courses[i].semester.substring(rawData.result.courses[i].semester.length - 1);

		semesterArray[i] = year + " " + season;
	}

	semesterArray.sort();

	for (var i = 0; i < rawData.result.courses.length; i++) {
		coursePathArray[i] = rawData.result.courses[i].path;
		semesterNumArray[i] = i;
		buildData(coursePathArray, semesterArray, semesterNumArray, i);
	}

	function buildData(coursePathArray, semesterArray, semesterNumArray, i) {
		d3.json(base + coursePathArray[i] + "/reviews/?token=" + token, function(error, data) {
			var numStudents = data.result.values[0].num_students,
					semester = semesterArray[i],
					difficulty = data.result.values[0].ratings.rDifficulty;

			forCharts.push({
				numStudents: numStudents,
				semester: semester,
				semesterNum: semesterNumArray[i],
				difficulty: difficulty
			});

			if (i == rawData.result.courses.length - 1) {
				var ndx = crossfilter(forCharts);

				makeNumStudentsBubbleChart(forCharts, ndx);
				makeDifficultyBubbleChart(forCharts, ndx);
			}
		});
	}

	function makeNumStudentsBubbleChart(forCharts, ndx) {
    var semester = ndx.dimension(function(d) {
      return d.semesterNum;
    });

    var numStudents = semester.group().reduceSum(function(d) {
      return d.numStudents;
    });

		bubbleChart = dc.bubbleChart("#numStudentsBubbleChart");

		bubbleChart.width(1200)
				.height(400)
				.dimension(semester)
				.group(numStudents)
			  .keyAccessor(function (p) {
			    return p.key;
			  })
			  .valueAccessor(function (p) {
			    return p.value;
			  })
			  .maxBubbleRelativeSize(0.015)
			  .x(d3.scale.linear().domain([-1, semesterArray.length]))
			  .y(d3.scale.linear().domain([0, 200]))
				.radiusValueAccessor(function (p) {
				    return p.value;
				 })
  			.r(d3.scale.linear().domain([0, 100]))
			  // .elasticY(true)
  			.elasticX(false)
			  .xAxisLabel("Semester")
			  .yAxisLabel("Number of Students (Per Section)")
			  .renderLabel(false)
			  .label(function (p) {
					if (p.key <= semesterArray.length - 1) {
						if (semesterArray[p.key].split(" ")[1] == "A") {
							return semesterArray[p.key].split(" ")[0] + " Spring";
						}
						else if (semesterArray[p.key].split(" ")[1] == "C"){
							return semesterArray[p.key].split(" ")[0] + " Fall";
						}
						else {
							return semesterArray[p.key].split(" ")[0] + " Summer";
						}
					}
			  })
				.renderHorizontalGridLines(true)
				.transitionDuration(700);

		bubbleChart.xAxis().tickFormat(function (v) {
			if (v <= semesterArray.length - 1 && v >= 0) {
				if (semesterArray[v].split(" ")[1] == "A") {
					return semesterArray[v].split(" ")[0] + " Spring";
				}
				else if (semesterArray[v].split(" ")[1] == "C"){
					return semesterArray[v].split(" ")[0] + " Fall";
				}
				else {
					return semesterArray[v].split(" ")[0] + " Summer";
				}
			}
		});

		dc.renderAll();
	}

	function makeDifficultyBubbleChart(forCharts, ndx) {
    var semester = ndx.dimension(function(d) {
      return d.semesterNum;
    });

    var difficulty = semester.group().reduceSum(function(d) {
      return d.difficulty;
    });

		bubbleChart = dc.bubbleChart("#difficultyBubbleChart");

		bubbleChart.width(1200)
				.height(400)
				.dimension(semester)
				.group(difficulty)
			  .keyAccessor(function (p) {
			    return p.key;
			  })
			  .valueAccessor(function (p) {
			    return p.value;
			  })
			  .maxBubbleRelativeSize(0.015)
			  .x(d3.scale.linear().domain([-1, semesterArray.length]))
			  .y(d3.scale.linear().domain([0, 4]))
				.radiusValueAccessor(function (p) {
				    return p.value;
				 })
  			.r(d3.scale.linear().domain([0, 100]))
			  // .elasticY(true)
  			.elasticX(false)
			  .xAxisLabel("Semester")
			  .yAxisLabel("Difficulty Rating")
			  .renderLabel(false)
			  .label(function (p) {
					if (p.key <= semesterArray.length - 1) {
						if (semesterArray[p.key].split(" ")[1] == "A") {
							return semesterArray[p.key].split(" ")[0] + " Spring";
						}
						else if (semesterArray[p.key].split(" ")[1] == "C"){
							return semesterArray[p.key].split(" ")[0] + " Fall";
						}
						else {
							return semesterArray[p.key].split(" ")[0] + " Summer";
						}
					}
			  })
				.renderHorizontalGridLines(true)
				.transitionDuration(700);

		bubbleChart.xAxis().tickFormat(function (v) {
			if (v <= semesterArray.length - 1 && v >= 0) {
				if (semesterArray[v].split(" ")[1] == "A") {
					return semesterArray[v].split(" ")[0] + " Spring";
				}
				else if (semesterArray[v].split(" ")[1] == "C"){
					return semesterArray[v].split(" ")[0] + " Fall";
				}
				else {
					return semesterArray[v].split(" ")[0] + " Summer";
				}
			}
		});

		dc.renderAll();
	}
});