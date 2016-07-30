app.filter('tag', function() {
    return function (items, query) {
        var filtered = [];

        if (
            angular.isArray(query) === false ||
            query === null ||
            (angular.isArray(query) && query.length === 0) ||
            (typeof query === 'string' && query.length === 0)
        ) return items;

        angular.forEach(items, function(item){
            if(
                typeof item.tags !== 'undefined' &&
                Array.isArray(item.tags) &&
                item.tags.length > 0
            ){
                angular.forEach(item.tags, function(tag){
                    if(query.indexOf(tag.text) != -1)
                    {
                        if(filtered.indexOf(item) == -1)
                        {
                            filtered.push(item);
                        }
                        return;
                    }
                });
            }
        });
        return filtered;
    };
});
