app.filter('active', ['User', function(User){
    return function (items, state) {

        if(state === 'all') return items;

        if(
            typeof User.preferences.ace === 'undefined' ||
            typeof User.preferences.ace.visibleModes === 'undefined'
        ) return [];

        var filtered = [];

        angular.forEach(items, function(item){
            if(User.preferences.ace.visibleModes[item.mode] === true){
                filtered.push(item);
            }
        });

        return filtered;

    };
}]);
