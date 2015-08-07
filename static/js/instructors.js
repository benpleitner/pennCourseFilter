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
			firstName = data.result.values[0].instructor.first_name;
			lastName = data.result.values[0].instructor.last_name;

			forCharts.push({
				firstName: firstName,
				lastName: lastName
			})

			if (i == instructorPathArray.length - 1) {
	  		var ndx = crossfilter(forCharts); //Prepare the data to be crossfiltered
				
				makeDataTable(forCharts, ndx);
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
	        function(d) { return d.firstName + " " + d.lastName; }
	      ])
	      .sortBy(function (d) {
	        return d.course;
	      })
	      .order(d3.ascending);

	  dc.renderAll();
    spinner.stop();
    $(".container").css("display", "inherit");
	}
});