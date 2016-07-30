app.filter('size', function(){
    return function (input) {
        if(typeof input === 'undefined' || input === null) return '0 bytes';

        var bytes = encodeURI(input).split(/%..|./).length - 1;
        var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
        var e = Math.floor(Math.log(bytes) / Math.log(1024));
        if(!isFinite(e)) return "0 bytes";
        var size = (bytes / Math.pow(1024, e)).toFixed(0) + " " + s[e];
        return size;
    };
});