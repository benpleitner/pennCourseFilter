var token = "public";
var base = "http://api.penncoursereview.com/v1/";

d3.json(amplify.store("hello"), function(error, rawData) {
	var courseIdTag = rawData.result.id; //Tag - for example "CIS"

	//Build an array that holds all the paths to each courses json files
	var coursePathArray = [];
	var courseNumArray = [];
	for (var i = 0; i < rawData.result.coursehistories.length; i++) {
		coursePathArray[i] = rawData.result.coursehistories[i].path;
		courseNumArray[i] = rawData.result.coursehistories[i].aliases[0];
	}

	// console.log(rawData.result.coursehistories[0].path);
	// console.log(coursePathArray)

	//Get the reviews for each course in the department
	// for (var j = 0; j < coursePathArray.length; j++) {
		d3.json(base + coursePathArray[5] + "/reviews/?token=" + token, function(error, data) {
			var totalReviewers = 0,
					totalStudents = 0,
					avgDifficulty = 0,
					totDifficulty = 0,
					numSemesters = 0;

			data.result.values.forEach(function (d) {
				var numReviewers = d.num_reviewers,
						numStudents = d.num_students,
						difficulty = d.ratings.rDifficulty;
				
				totalReviewers += d.num_reviewers;
				totalStudents += d.num_students;
				totDifficulty += parseFloat(d.ratings.rDifficulty);
				numSemesters++;

				// console.log(d);
			});

			avgDifficulty = totDifficulty / numSemesters;

			// console.log(totalReviewers + " " + totalStudents + " " + avgDifficulty);		
		});
	// }
});