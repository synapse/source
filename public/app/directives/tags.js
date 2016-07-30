app.directive('tags', function(){
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            element.tagsManager();
        }
    };
});