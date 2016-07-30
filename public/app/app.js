$(document).on('click', '[data-toggle="dropdown"]', function (e) {
    var btn = $(e.currentTarget);
    var ddw = $(btn.data('target'));
    var position = btn.data('position');
    var dd = ddw.children(".dropdown-menu");

    var dropDownTop = btn.offset().top + btn.outerHeight();
    dd.css('top', dropDownTop + "px");
    if (typeof position === 'undefined') {
        dd.css('left', (btn.offset().left - dd.outerWidth() + btn.outerWidth() ) + "px");
    } else if (position == 'left') {
        dd.css('left', btn.offset().left + "px");
    }
});

window.version = '1.4.0';
var language = window.navigator.language.substring(0, 2);
var languages = ['en', 'es', 'it', 'ro', 'fr', 'zh'];

Parse.initialize("wXFnX7DZNHreJtbaVTy6FBfZxp0cphmqwlDmQZDQ", "j45FTEIeVh3AUG1WaI1MIyc1UaCXUSXa2WPwu8jE");
var app = angular.module("Code", ['ngRoute', 'ui.ace', 'shagstrom.angular-split-pane', 'cfp.hotkeys', 'ngTagsInput', 'pascalprecht.translate']);

app.config(['$routeProvider', '$locationProvider', '$translateProvider', function($routeProvider, $locationProvider, $translateProvider) {

    $translateProvider.useStaticFilesLoader({
        prefix: 'locale/',
        suffix: '.json'
    });
    var lang = window.localStorage.language || language;
    if(languages.indexOf(lang) == -1) lang = 'en';
    $translateProvider.preferredLanguage(lang);
    $translateProvider.useSanitizeValueStrategy(null);

    $routeProvider
        .when('/main', {
            templateUrl: 'main.html',
            controller: 'MainCtrl'
        })
        .when('/login', {
            templateUrl: 'login.html',
            controller: 'LoginCtrl'
        });

}]);

app.run(["User", "$location", "$rootScope", "$window", function (User, $location, $rootScope, $window) {

    $rootScope.OS = OS;

    if(!User.getCurrent()) {
        $location.path("login");
    } else {
        $location.path("main");
    }

    // check if the terminal is online
    $rootScope.online = $window.navigator.onLine;
    $rootScope.useOffline = false;
    $window.addEventListener("offline", function () {
        $rootScope.$apply(function () {
            $rootScope.online = false;
        });
    }, false);
    $window.addEventListener("online", function () {
        $rootScope.useOffline = false;
        $rootScope.$apply(function () {
            $rootScope.online = true;
        });
    }, false);

    $rootScope.$on('$routeChangeSuccess', function(event, toState, toParams, fromState, fromParams){
        $rootScope.pageClass = toState.loadedTemplateUrl.replace('.html','');
    });

}]);

app.constant("MSG", {
    100: "Connection error.",
    101: "Username or password invalid.",
    200: "The username is missing or empty.",
    201: "The password is missing or empty.",
    202: "This username has already been taken.",
    203: "This email has already been taken.",
    204: "Missing email address",
    205: "A user with the specified email was not found.",
    701: "Invalid license key."
});

var newSnippet = function()
{
    var appElement = document.getElementById("appView");
    var $scope = angular.element(appElement).scope();
    $scope.Snippets.newSnippet($scope.Snippets.filters.queryG);
};

var saveSnippet = function()
{
    var appElement = document.getElementById("appView");
    var $scope = angular.element(appElement).scope();
    if(!$scope.Snippets.selected) return;
    $scope.Snippets.selected.save();
};

var closeSnippet = function()
{
    var appElement = document.getElementById("appView");
    var $scope = angular.element(appElement).scope();
    if(!$scope.Snippets.selected) return;
    $scope.$applyAsync(function() {
        $scope.Snippets.selected = null;
    });
};

var deleteSnippet = function()
{
    var appElement = document.getElementById("appView");
    var $scope = angular.element(appElement).scope();
    if(!$scope.Snippets.selected) return;
    $scope.Snippets.deleteSnippet($scope.Snippets.selected);
};

var newGroup = function()
{
    var appElement = document.getElementById("appView");
    var $scope = angular.element(appElement).scope();
    $scope.Snippets.newGroup();
};

var openPreferences = function()
{
    var appElement = document.getElementById("appView");
    var $scope = angular.element(appElement).scope();
    $scope.user.openPrefs();
};

var toggleSearch = function()
{
    var appElement = document.getElementById("appView");
    var $scope = angular.element(appElement).scope();
    $scope.toggleSearch();
};

//@prepros-prepend plugins/*.min.js
//@prepros-append directives_3rd/*.min.js
//@prepros-append controllers/*.js
//@prepros-append directives/*.js
//@prepros-append filters/*.js
//@prepros-append services/*.js
