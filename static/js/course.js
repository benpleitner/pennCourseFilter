var token = "public";
var base = "http://api.penncoursereview.com/v1/";

d3.json(base + amplify.store("coursePath") + "/?token=" + token, function(error, rawData) {
	// console.log(rawData.result);
});