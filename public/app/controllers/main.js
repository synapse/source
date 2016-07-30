app.controller("MainCtrl", ["$scope", "User", "Snippets", "Editor", "Bridge", "$location", "hotkeys", "$translate",
    function($scope, User, Snippets, Editor, Bridge, $location, hotkeys, $translate){

    $scope.share = {
        show: false,
        mail: "",
        sharing: false
    };

    // temp selected snippet to be compared with the original
    var snippet = null;

    $scope.user = User;
    if(!$scope.user.getCurrent())
    {
        $location.path("login");
    }

    $scope.Editor = Editor;
    $scope.Snippets = Snippets;
    $scope.Bridge = Bridge;

    $scope.goToLogin = function()
    {
        $location.path("login");
    };

    $scope.Snippets.loadGroups();
    $scope.Snippets.loadSnippets();


    $scope.modeChanged = function()
    {
        $scope.Snippets.selected.type = $scope.Editor.mode;
        //$scope.Snippets.selected.changed();
    };

    $scope.showInGroup = function(id)
    {
        $scope.Snippets.filters.queryG = id;
    };

    $scope.showWithTag = function(tag)
    {
        $scope.Snippets.filters.queryT.push(tag);
    };

    $scope.removeTagFilter = function(tag)
    {
        $scope.Snippets.filters.queryT.splice($scope.Snippets.filters.queryT.indexOf(tag), 1);
    };

    var compareTags = function(tags1, tags2)
    {
        if(typeof tags1 === 'undefined' || tags1 === null || typeof tags2 === 'undefined' || tags2 === null) return false;
        if(tags1.length != tags2.length) return false;
        var ne = true;
        angular.forEach(tags1, function(tag, i){
            if(tag.text != tags2[i].text) ne = false;
        });
        return ne;
    };

    $scope.setSelected = function(selected)
    {
        if(
            snippet !== null &&
            $scope.Snippets.selected !== null &&
            (
                snippet.name != $scope.Snippets.selected.name ||
                snippet.code != $scope.Snippets.selected.code ||
                snippet.type != $scope.Snippets.selected.type ||
                snippet.groupName != $scope.Snippets.selected.groupName ||
                !compareTags(snippet.tags, $scope.Snippets.selected.tags)
            ) &&
            $scope.user.preferences.autosave
        )
        {
            $scope.Snippets.selected.save();
        }

        $scope.share = {
            show: false,
            mail: "",
            sharing: false
        };

        // close the tag input
        if(
            typeof selected.tags === 'undefined' ||
            selected.tags === null ||
            (Array.isArray(selected.tags) && selected.tags.length === 0)
        )
        {
            $('#selected-snippet').removeClass('show-tags');
        }


        $scope.Snippets.selected = selected;
        snippet = angular.copy(selected); // temp copy
        $scope.Editor.setSettings({
            mode: selected.type
        });
    };

    // show or hide the search
    $scope.toggleSearch = function()
    {
        $('.searchbox-wrapper').toggleClass('visible').promise().done(function(){
            if($('.searchbox-wrapper').hasClass('visible')) {
                $('.searchbox-wrapper').find('input').focus();
            } else {
                $('.searchbox-wrapper').find('input').blur();
            }
        });

        if(typeof $scope.Snippets.filters.queryQ === 'string' && $scope.Snippets.filters.queryQ.length > 0){
            $scope.Snippets.filters.queryQ = null;
        }
    };

    // show or hide the tags
    $scope.toggleTags = function()
    {
        $('#selected-snippet').removeClass('show-notes').toggleClass('show-tags');
    };

    // show or hide the notes
    $scope.toggleNotes = function()
    {
        $('#selected-snippet').removeClass('show-tags').toggleClass('show-notes');
    };

    $scope.shareSnippet = function()
    {
        $scope.$applyAsync(function(){
            $scope.share.sharing = true;
        });
        $scope.Snippets.share($scope.share, function(success){
            if(success){
                $scope.share = {
                    show: false,
                    mail: "",
                    sharing: false
                };
            }
            $scope.$applyAsync(function(){
                $scope.share.sharing = false;
            });
        });
    };

    // collapse sidebar
    var collapseTimer;
    $scope.collapse = function(id)
    {
        $('#'+id).toggleClass('collapsed');
        $scope.user.preferences[id + 'Collapsed'] = $('#'+id).hasClass('collapsed');
        clearTimeout(collapseTimer);

        collapseTimer = setTimeout(function(){
            $scope.user.savePrefs();
        }, 5000);
    };

    // set reorder
    var reorderTimer = null;
    $scope.groupReorderCol = function(col){
        $scope.user.preferences.groupReorder = col;
        clearTimeout(reorderTimer);
        reorderTimer = setTimeout(function(){
            $scope.user.savePrefs();
        }, 5000);
    };
    $scope.groupReorderDir = function(dir){
        $scope.user.preferences.groupReorderReverse = dir;
        clearTimeout(reorderTimer);
        reorderTimer = setTimeout(function(){
            $scope.user.savePrefs();
        }, 5000);
    };

    $scope.snippetReorderCol = function(col)
    {
        $scope.user.preferences.snippetReorder = col;
        clearTimeout(reorderTimer);
        reorderTimer = setTimeout(function(){
            $scope.user.savePrefs();
        }, 5000);
    };
    $scope.snippetReorderDir = function(dir)
    {
        $scope.user.preferences.snippetReorderReverse = dir;
        clearTimeout(reorderTimer);
        reorderTimer = setTimeout(function(){
            $scope.user.savePrefs();
        }, 5000);
    };

    $scope.destroyAll = function()
    {
        $('#profileModal').modal('hide');

        $scope.Bridge.confirm($translate.instant('TITLE_DELETE_ACCOUNT'), $translate.instant('MESSAGE_DELETE_ACCOUNT'), $translate.instant('YES'), $translate.instant('NO'), undefined, function(result){
            if(result){
                $scope.Snippets.deleteAll(function(){
                    $scope.user.delete(function(){
                        console.log("User deleted callback");
                        $scope.user.logout($scope.goToLogin);
                    });
                });
            } else {
                $('#profileModal').modal('show');
            }
        });
    };

    // hotkeys
    if($scope.OS != 'MacIntel') {
        hotkeys.add({
            combo: 'mod+n',
            description: $translate.instant('LABEL_CREATE_NEW_SNIPPET'),
            allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
            callback: function () {
                $scope.Snippets.newSnippet($scope.Snippets.filters.queryG);
            }
        });
        hotkeys.add({
            combo: 'mod+g',
            description: $translate.instant('LABEL_CREATE_NEW_GROUP'),
            allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
            callback: function () {
                $scope.Snippets.newGroup();
            }
        });
        hotkeys.add({
            combo: 'mod+,',
            description: $translate.instant('LABEL_OPEN_PREFERENCES'),
            allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
            callback: function () {
                $scope.user.openPrefs();
            }
        });
        hotkeys.add({
            combo: 'mod+s',
            description: $translate.instant('LABEL_SAVE_SNIPPET'),
            allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
            callback: function () {
                $scope.Snippets.selected.save();
            }
        });
        hotkeys.add({
            combo: 'mod+f',
            description: $translate.instant('LABEL_SEARCH_SNIPPET'),
            allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
            callback: function () {
                $scope.toggleSearch();
            }
        });
    }

    $scope.toggleHelp = function(){
        hotkeys.toggleCheatSheet();
    };


}]);
