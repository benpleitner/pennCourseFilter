var token = "public";
var base = "http://api.penncoursereview.com/v1/";
var uri = base + "/depts/?token=" + token;

(function() {
  var app = angular.module("departments", []);

  app.controller("DepartmentController", ["$scope", "$http", function($scope, $http) {
  	$http.get(uri).success(function(rawData) {
  		$scope.depts = rawData.result.values;
  	});

  	$scope.setPath = function(path) {
  		var coursesUri = base + path + "/?token=" + token;
  		amplify.store("uri", coursesUri);
  	};
  }]);
})();