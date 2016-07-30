app.filter('search', function() {
    return function (items, query) {
        var filtered = [];

        if (typeof query === 'undefined' ||
            query === null ||
            (typeof query === 'string' && query.length === 0)
        ) return items;

        angular.forEach(items, function (item) {
            if (item.name.toLowerCase().indexOf(query.toLowerCase()) > -1) {
                filtered.push(item);
            }
        });
        return filtered;
    };
});