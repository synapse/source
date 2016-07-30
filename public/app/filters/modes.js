app.filter('modes', ['User', function(User) {
    return function (items, selected) {

        var filtered = [];
        var added = false;

        if(
            typeof User.preferences.ace.visibleModes === 'undefined'
        ) return items;

        angular.forEach(items, function(item){
            if(
                typeof User.preferences.ace.visibleModes[item.mode] !== 'undefined' &&
                User.preferences.ace.visibleModes[item.mode] === true
            ){
                filtered.push(item);

                if(typeof selected !== 'undefined' && item.mode == selected) added = true;
            }
        });

        if(
            typeof selected !== 'undefined' &&
            !added
        )
        {
            angular.forEach(items, function(item){
                if(item.mode == selected)
                {
                    filtered.push(item);
                    return;
                }
            });
        }

        return filtered;
    };
}]);
