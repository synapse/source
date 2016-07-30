app.directive('tip', function(){
    return {
        restrict: "C",
        link: function(scope, element, attrs) {
            element.tooltip();
        }
    };
});

app.directive('pop', function(){
    return {
        restrict: "C",
        link: function(scope, element, attrs) {
            element.popover();
        }
    };
});