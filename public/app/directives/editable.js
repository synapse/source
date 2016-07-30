app.directive("edit", function() {
    return {
        restrict: "AC",
        //require: "ngModel",
        scope: {
            edit: '&'
        },
        link: function(scope, element, attrs) {

            var temp = null;
            var saving = false;

            var read = function()
            {
                var current = element.html();
                if(typeof scope.edit !== 'undefined' && current != temp)
                {
                    scope.edit({name:element.html()});
                }
                element.prop('contenteditable', false);
            };

            element.bind("blur", function() {
                if(saving) return;
                saving = true;
                scope.$apply(read);
            });

            element.bind("keyup", function(e){
                if(e.keyCode == 13)
                {
                    if(saving) return;
                    saving = true;

                    e.preventDefault();
                    element.blur();
                    scope.$apply(read);
                }
            });

            element.keypress(function(e){ return e.which != 13; });

            element.click(function(){
                saving = false;
                temp = element.html();
                element.prop('contenteditable', true);
                element.focus();
            });
        }
    };
});
