app.directive("preferences", ['Editor', 'User', '$window', '$translate', function(Editor, User, $window, $translate){
    return {
        templateUrl: 'preferences.html',
        restrict: 'E',
        link: function (scope, element, attrs) {
            scope.Editor = Editor;
            scope.User = User;

            $('#preferencesModal')
                .on('hidden.bs.modal', function(){
                    User.savePrefs();

                    $window.localStorage.language = User.preferences.language;
                    $translate.use($window.localStorage.language);
                });

            $('#preferencesModal a[data-toggle="tab"]').on('show.bs.tab', function (e) {
                var width = $(e.target).data('width');
                $('#preferencesModal .modal-dialog').animate({width: width}, 200);
            });

        }
    };
}]);
