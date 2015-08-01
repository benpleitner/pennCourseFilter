var token = "public";
var base = "http://api.penncoursereview.com/v1//"
var uri = base + "/depts/?token=" + token;

(function() {
  var app = angular.module("departments", []);

  app.controller("DepartmentController", ["$scope", "$http", function($scope, $http) {
  	$http.get(uri).success(function(rawData) {
  		$scope.depts = rawData.result.values;
  		console.log($scope.depts);
  	});
    // this.dept = 1;

    // this.setYear = function(value){
    //   this.year = value;
    // };
  }]);

})();

// d3.json(uri, function(error, rawData) {
// 	console.log(rawData.result.values);
// })