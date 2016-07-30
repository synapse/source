app.directive("enter", ["$timeout", function($timeout){
    return {
        restrict: 'A',
        scope: {
            enter: "&",
            on: "="
        },
        link: function (scope, element, attrs) {
            element.bind("keyup", function (e) {
                if (e.keyCode === 13) {
                    scope.enter();
                }
            });

            scope.$watch('on', function(value) {
                if (value === true) {
                    $timeout(function(){
                        element[0].focus();
                    }, 0);
                }
            });
        }
    };
}]);