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

d3.json(amplify.store("uri"), function(error, rawData) {
	var courseIdTag = rawData.result.id; //Tag - for example "CIS"
	var deptName = rawData.result.name; //Department name

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
					totCourseQuality = 0,
					totAmountOfWork = 0,
					totRecForMajor = 0,
					totRecForNonMajor = 0,
					numSemesters = 0;

			data.result.values.forEach(function (d) {
				totalReviewers += d.num_reviewers;
				totalStudents += d.num_students;
				totCourseQuality += parseFloat(d.ratings.rCourseQuality);
				totDifficulty += parseFloat(d.ratings.rDifficulty);
				totAmountOfWork += parseFloat(d.ratings.rWorkRequired);
				totRecForMajor += parseFloat(d.ratings.rRecommendMajor);
				totRecForNonMajor += parseFloat(d.ratings.rRecommendNonMajor);
				numSemesters++;
			});

			avgDifficulty = totDifficulty / numSemesters;
			var avgCourseQuality = totCourseQuality / numSemesters;
			var avgAmountOfWork = totAmountOfWork / numSemesters;
			var avgNumStudents = totalStudents / numSemesters;
			var avgRecForMajor = totRecForMajor / numSemesters;
			var avgRecForNonMajor = totRecForNonMajor / numSemesters;

			//Assign a range number to ratings
			var difficultyNum = getRating(avgDifficulty);
			var qualityNum = getRating(avgCourseQuality);
			var amountOfWorkNum = getRating(avgAmountOfWork);
			var studentNumber = getStudentNumber(avgNumStudents);
			var recForMajorNum = getRating(avgRecForMajor);
			var recForNonMajorNum = getRating(avgRecForNonMajor);

			forCharts.push({
				course: courseNumArray[j],
				courseName: courseNameArray[j],
				numReviewers: totalReviewers,
				numStudents: avgNumStudents,
				studentNumber: studentNumber,
				avgDifficulty: avgDifficulty,
				difficultyNum: difficultyNum,
				avgCourseQuality: avgCourseQuality,
				qualityNum: qualityNum,
				avgAmountOfWork: avgAmountOfWork,
				amountOfWorkNum: amountOfWorkNum,
				avgRecForMajor: avgRecForMajor,
				recForMajorNum: recForMajorNum,
				avgRecForNonMajor: avgRecForNonMajor,
				recForNonMajorNum: recForNonMajorNum
			});

			if (j == coursePathArray.length - 1) {
    		var ndx = crossfilter(forCharts); //Prepare the data to be crossfiltered
				
				makeDataTable(forCharts, ndx);
				makeDifficultyPieChart(forCharts, ndx);
				makeQaulityPieChart(forCharts, ndx);
				makeAmountOfWorkPieChart(forCharts, ndx);
				makeStudentRowChart(forCharts, ndx);
				makeRecForMajorRowChart(forCharts, ndx);
				makeRecForNonMajorRowChart(forCharts, ndx);	
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
          function(d) {
						if (isNaN(d.avgCourseQuality)) {
							return "No data";
						}
						else {
          		return d.avgCourseQuality.toFixed(2);
          	}
          },
          function(d) {
						if (isNaN(d.avgDifficulty)) {
							return "No data";
						}
						else {
          		return d.avgDifficulty.toFixed(2);
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
      return 1;
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

	function makeQaulityPieChart(forCharts, ndx) {
    var quality = ndx.dimension(function(d) {
      return d.qualityNum;
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

	function makeAmountOfWorkPieChart(forCharts, ndx) {
    var work = ndx.dimension(function(d) {
      return d.amountOfWorkNum;
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

	function makeStudentRowChart(forCharts, ndx) {
    var numStudents = ndx.dimension(function(d) {
      return d.studentNumber;
    });

    var numStudentsGroup = numStudents.group().reduceSum(function(d) {
      return 1;
    });

    rowChart = dc.rowChart("#numStudentsRowChart");

    rowChart.width(350)
          .height(350)
          .margins({top: 100, right: 10, bottom: 30, left: 10})
          .dimension(numStudents)
          .group(numStudentsGroup)
          .elasticX(true)
          .gap(1)
          .x(d3.scale.linear().domain([-1, 8]))
          .label(function(d) {
            var num = d.key;
            switch (num) {
              case 0:
                return "1 - 50";
              case 1:
                return "50 - 100";
              case 2:
                return "100 - 200";
              case 3:
                return "200+";
            }
          })
          .transitionDuration(700);

    dc.renderAll();

		addXAxis(rowChart, "Nuber of Courses");
	}

	function makeRecForMajorRowChart(forCharts, ndx) {
    var major = ndx.dimension(function(d) {
      return d.recForMajorNum;
    });

    var majorGroup = major.group().reduceSum(function(d) {
      return 1;
    });

    rowChart = dc.rowChart("#recForMajorRowChart");

    rowChart.width(350)
          .height(350)
          .margins({top: 100, right: 10, bottom: 30, left: 10})
          .dimension(major)
          .group(majorGroup)
          .elasticX(true)
          .gap(1)
          .x(d3.scale.linear().domain([-1, 8]))
          .label(function(d) {
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

		addXAxis(rowChart, "Nuber of Courses");
}

	function makeRecForNonMajorRowChart(forCharts, ndx) {
    var nonMajor = ndx.dimension(function(d) {
      return d.recForNonMajorNum;
    });

    var nonMajorGroup = nonMajor.group().reduceSum(function(d) {
      return 1;
    });

    rowChart = dc.rowChart("#recForNonMajorRowChart");

    rowChart.width(350)
          .height(350)
          .margins({top: 100, right: 10, bottom: 30, left: 10})
          .dimension(nonMajor)
          .group(nonMajorGroup)
          .elasticX(true)
          .gap(1)
          .x(d3.scale.linear().domain([-1, 8]))
          .label(function(d) {
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

		addXAxis(rowChart, "Nuber of Courses");
	}

	//Helper function that adds an x-axis label to the row chart
  function addXAxis(chartToUpdate, displayText) {
    chartToUpdate.svg()
        .append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", chartToUpdate.width() / 2)
        .attr("y", chartToUpdate.height())
        .text(displayText);
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

	function getStudentNumber(numStudents) {
		if (numStudents < 50) {
			return 0;
		}
		else if (numStudents < 100) {
			return 1;
		}
		else if (numStudents < 200) {
			return 2;
		}
		else if (isNaN(numStudents)) {
			return;
		}
		else {
			return 3;
		}
	}

});