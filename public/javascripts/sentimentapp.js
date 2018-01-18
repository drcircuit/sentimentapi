angular.module('sentiment', [])
    .value('apiurl', 'http://localhost:3000/sentiments')
    .controller('sentimentCtrl', ['$scope', '$http', '$q','apiurl', function ($scope, $http, $q, url) {
        $scope.sentiments = [];
        $http.get(url)
            .then(function(res){
                res.data.forEach(function (s) {
                    $scope.sentiments.push({
                        text: s.text,
                        sentiment: s.sentiment.toLowerCase(),
                        style: s.sentiment.toLowerCase()
                    });
                });
            }, function(err){
                console.log(err);
            });
    }]);