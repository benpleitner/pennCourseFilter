var token = "public";
var base = "http://api.penncoursereview.com/v1/";

//Start the spinner and hide the content
var opts = {
  lines: 13, // The number of lines to draw
  length: 20, // The length of each line
  width: 10, // The line thickness
  radius: 30, // The radius of the inner circle
  corners: 1, // Corner roundness (0..1)
  rotate: 0, // The rotation offset
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: '#03b7f9', // #rgb or #rrggbb or array of colors
  speed: 1, // Rounds per second
  trail: 60, // Afterglow percentage
  shadow: false, // Whether to render a shadow
  hwaccel: false, // Whether to use hardware acceleration
  className: 'spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: '50%', // Top position relative to parent
  left: '50%' // Left position relative to parent
};

$(".container").css("display", "none");

var target = document.getElementById("spin");
var spinner = new Spinner(opts).spin(target);

d3.json(amplify.store("hello"), function(error, rawData) {
	var courseIdTag = rawData.result.id; //Tag - for example "CIS"
	var deptName = rawData.result.name;

	// deptName.charAt(0).toUpperCase() + deptName.slice(1).toLowerCase()

	document.getElementById("header").innerHTML = deptName;

	//Build an array that holds all the paths to each courses json files
	var coursePathArray = [],
			courseNumArray = [],
			courseNameArray = [];

	for (var i = 0; i < rawData.result.coursehistories.length; i++) {
		coursePathArray[i] = rawData.result.coursehistories[i].path;
		var id = rawData.result.coursehistories[i].aliases[0].split("-")[0];

		var count = 1;
		while (id != courseIdTag) {
			id = rawData.result.coursehistories[i].aliases[count].split("-")[0];
			count++;
		}

		var num = rawData.result.coursehistories[i].aliases[0].split("-")[1];
		courseNumArray[i] = id + " " + num;

		courseNameArray[i] = rawData.result.coursehistories[i].name;
	}

	var forCharts = [];

	//Get the reviews for each course in the department
	for (var j = 0; j < coursePathArray.length; j++) {
		buildData(coursePathArray, courseNumArray, courseNameArray, j);
	}

	//Function that builds the array to be used for crossfiltering
	function buildData(coursePathArray, courseNumArray, courseNameArray, j) {
		d3.json(base + coursePathArray[j] + "/reviews/?token=" + token, function(error, data) {
			var totalReviewers = 0,
					totalStudents = 0,
					avgDifficulty = 0,
					totDifficulty = 0,
					numSemesters = 0;

			data.result.values.forEach(function (d) {
				// var numReviewers = d.num_reviewers,
				// 		numStudents = d.num_students,
				// 		difficulty = d.ratings.rDifficulty;
				
				totalReviewers += d.num_reviewers;
				totalStudents += d.num_students;
				totDifficulty += parseFloat(d.ratings.rDifficulty);
				numSemesters++;
			});

			avgDifficulty = totDifficulty / numSemesters;

			//Assign a difficulty range number
			if (avgDifficulty < 1) {
				var difficultyNum = 0;
			}
			else if (avgDifficulty < 2) {
				var difficultyNum = 1;
			}
			else if (avgDifficulty < 3) {
				var difficultyNum = 2;
			}
			else {
				var difficultyNum = 3;
			}

			forCharts.push({
				course: courseNumArray[j],
				courseName: courseNameArray[j],
				numReviewers: totalReviewers,
				numStudents: totalStudents,
				avgDifficulty: avgDifficulty,
				difficultyNum: difficultyNum
			});

			if (j == coursePathArray.length - 1) {
    		var ndx = crossfilter(forCharts); //Prepare the data to be crossfiltered
				
				makeDataTable(forCharts, ndx);
				makeDifficultyPieChart(forCharts, ndx);
			}
		});
	};

	function makeDataTable(forCharts, ndx) {
    var coursesInfo = ndx.dimension(function(d) {
      return d.course;
    });

    //Data table
    dataTable = dc.dataTable("#dataTable")

    dataTable
        .dimension(coursesInfo)
        .group(function(d) {
            return "";
        })
        .size([Infinity])
        .columns([
          function(d) { return d.course + " (" + d.courseName + ")"; },
          function(d) { return d.avgDifficulty.toFixed(2); }
        ])
        .sortBy(function (d) {
          return d.course;
        })
        .order(d3.ascending);

    dc.renderAll();
    spinner.stop();
    $(".container").css("display", "inherit");
	}

	function makeDifficultyPieChart(forCharts, ndx) {
    var difficulty = ndx.dimension(function(d) {
      return d.difficultyNum;
    });

    var difficultyGroup = difficulty.group().reduceSum(function(d) {
      return d.difficultyNum;
    });

    pieChart = dc.pieChart("#difficultyPieChart");
    
    pieChart.width(342)
        .height(451)
        .dimension(difficulty)
        .group(difficultyGroup)
        .innerRadius(60)
        .radius(100)
        // .colors(d3.scale.ordinal().domain(["occupied", "semi", "offHours"]).range(["#0b50c2", "#0092cc", "#00b4b5"]))
        // .colorAccessor(function(d) {
        //   if (d.key == 1) {
        //     return "occupied";
        //   } else if (d.key == 0.5) {
        //     return "semi";
        //   } else {
        //     return "offHours";
        //   }
        // })
        .label(function (d) {
          if (d.key == 0) {
            return "0 - 1";
          } else if (d.key == 1) {
            return "1 - 2";
          } else if (d.key == 2) {
            return "2 - 3";
          } else {
          	return "3 - 4";
          }
        })
        .transitionDuration(700);

    dc.renderAll();
	}

});