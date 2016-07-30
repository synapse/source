app.controller("LoginCtrl", ["$scope", "User", "Bridge", "$location", function($scope, User, Bridge, $location){

    $scope.user = User;
    $scope.Bridge = Bridge;

    if($scope.user.getCurrent())
    {
        $location.path("main");
    }

    $scope.redirect = function()
    {
        $location.path("main");
    };

    $scope.login = function()
    {
        $scope.user.step = 1;
    };

    $scope.openContacts = function()
    {
        var remote = require('remote');
        var shell = remote.require('shell');
        shell.openExternal('http://getsourceapp.com');
    };

    $scope.openStore = function()
    {
        var remote = require('remote');
        var shell = remote.require('shell');
        shell.openExternal('http://getsourceapp.com/#purchase');
    };

}]);
