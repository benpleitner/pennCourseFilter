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

d3.json(base + "/instructors/?token=" + token, function(error, rawData) {
	var instructorPathArray = [];

	rawData.result.values.forEach(function (d) {
		if (d.depts[0] == amplify.store("deptName")) {
			instructorPathArray.push({
				path: d.path
			});
		}
	});

	var forCharts = [];

	for (var i = 0; i < instructorPathArray.length; i++) {
		buildData(instructorPathArray[i].path, i);
	}

	function buildData(instructorPath, i) {
		d3.json(base + instructorPath + "/reviews/?token=" + token, function(error, data) {
			var firstName = data.result.values[0].instructor.first_name,
					lastName = data.result.values[0].instructor.last_name,
					totInstructorQaulity = 0,
					totDifficulty = 0,
					totWork = 0,
					numSemesters = 0;

			data.result.values.forEach(function (d) {
				totInstructorQaulity += parseFloat(d.ratings.rInstructorQuality);
				totDifficulty += parseFloat(d.ratings.rDifficulty);
				totWork += parseFloat(d.ratings.rWorkRequired);
				numSemesters++;
			});

			var avgInstructorQuality = totInstructorQaulity / numSemesters,
					avgInstructorDifficulty = totDifficulty / numSemesters;
					avgAmountOfWork = totWork / numSemesters;

			var instructorQualityNum = getRating(avgInstructorQuality),
					instructorDifficultyNum = getRating(avgInstructorDifficulty),
					instructorWorkNum = getRating(avgAmountOfWork);

			forCharts.push({
				firstName: firstName,
				lastName: lastName,
				avgInstructorQuality: avgInstructorQuality,
				instructorQualityNum: instructorQualityNum,
				avgInstructorDifficulty: avgInstructorDifficulty,
				instructorDifficultyNum: instructorDifficultyNum,
				avgAmountOfWork: avgAmountOfWork,
				instructorWorkNum: instructorWorkNum
			})

			if (i == instructorPathArray.length - 1) {
	  		var ndx = crossfilter(forCharts); //Prepare the data to be crossfiltered
				
				makeDataTable(forCharts, ndx);
				makeInstructorQualityPieChart(forCharts, ndx);
				makeInstructorDifficultyPieChart(forCharts, ndx);
				makeInstructorAmountOfWorkPieChart(forCharts, ndx);
			}
		});
	}

	function makeDataTable(forCharts, ndx) {
	  var instructorInfo = ndx.dimension(function(d) {
	    return d.firstName;
	  });

	  //Data table
	  dataTable = dc.dataTable("#dataTable")

	  dataTable
	      .dimension(instructorInfo)
	      .group(function(d) {
	          return "";
	      })
	      .size([Infinity])
	      .columns([
	        function(d) { return d.firstName + " " + d.lastName; },
          function(d) {
						if (isNaN(d.avgInstructorQuality)) {
							return "No data";
						}
						else {
          		return d.avgInstructorQuality.toFixed(2);
          	}
          },
          function(d) {
						if (isNaN(d.avgInstructorDifficulty)) {
							return "No data";
						}
						else {
          		return d.avgInstructorDifficulty.toFixed(2);
          	}
          },
          function(d) {
						if (isNaN(d.avgAmountOfWork)) {
							return "No data";
						}
						else {
          		return d.avgAmountOfWork.toFixed(2);
          	}
          }
        ])
	      .sortBy(function (d) {
	        return d.lastName;
	      })
	      .order(d3.ascending);

	  dc.renderAll();
    spinner.stop();
    $(".container").css("display", "inherit");
	}

	function makeInstructorQualityPieChart(forCharts, ndx) {
    var quality = ndx.dimension(function(d) {
      return d.instructorQualityNum;
    });

    var qualityGroup = quality.group().reduceSum(function(d) {
      return 1;
    });

    pieChart = dc.pieChart("#qualityPieChart");
    
    pieChart.width(342)
        .height(451)
        .dimension(quality)
        .group(qualityGroup)
        .innerRadius(60)
        .radius(100)
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

	function makeInstructorDifficultyPieChart(forCharts, ndx) {
    var difficulty = ndx.dimension(function(d) {
      return d.instructorDifficultyNum;
    });

    var difficultyGroup = difficulty.group().reduceSum(function(d) {
      return 1;
    });

    pieChart = dc.pieChart("#difficultyPieChart");
    
    pieChart.width(342)
        .height(451)
        .dimension(difficulty)
        .group(difficultyGroup)
        .innerRadius(60)
        .radius(100)
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

	function makeInstructorAmountOfWorkPieChart(forCharts, ndx) {
    var work = ndx.dimension(function(d) {
      return d.instructorWorkNum;
    });

    var workGroup = work.group().reduceSum(function(d) {
      return 1;
    });

    pieChart = dc.pieChart("#amountOfWorkPieChart");
    
    pieChart.width(342)
        .height(451)
        .dimension(work)
        .group(workGroup)
        .innerRadius(60)
        .radius(100)
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

	function getRating(value) {
		if (value < 1) {
			return 0;;
		}
		else if (value < 2) {
			return 1;
		}
		else if (value < 3) {
			return 2;
		}
		else if (isNaN(value)) {
			return;
		}
		else {
			return 3;
		}
	}
});