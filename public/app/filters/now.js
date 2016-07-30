app.filter('toNow', ['$window', function($window){
    return function (input) {
        if(typeof input === 'undefined' || input === null) return '';
        moment.locale($window.localStorage.language || 'en');
        return moment(input).from(moment());
    };
}]);