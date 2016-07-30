app.filter('group', function() {
    return function (items, query) {
        var filtered = [];

        if (
            typeof query === 'undefined' ||
            query === null ||
            (typeof query === 'string' && query.length === 0)
        ) return items;

        angular.forEach(items, function(item){
            if(typeof item.group !== 'undefined') {
                if (item.group.id == query) {
                    filtered.push(item);
                }
            } else if(typeof item.group === 'undefined' && query == 'sharedwithme'){
                filtered.push(item);
            }
        });
        return filtered;
    };
});