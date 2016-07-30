var app             = require('app'); // Module to control application life.
var http            = require('http');
var dialog          = require('dialog');
var BrowserWindow   = require('browser-window'); // Module to create native browser window.
var fs              = require('fs');
var crypto          = require('crypto');
var hash            = crypto.createHash('md5');
var shell           = require('shell');
var version         = 133;

var Toaster = require('electron-toaster');
var toaster = new Toaster();


require('crash-reporter').start();

var mainWindow = null;


app.on('window-all-closed', function() {
    if (process.platform != 'darwin')
        app.quit();
});


app.on('ready', function() {

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 600,
        'min-width': 1100,
        'min-height': 600,
        frame: true
    });

    toaster.init(mainWindow);

    mainWindow.loadUrl('file://' + __dirname + '/index.html');

    //mainWindow.openDevTools();

    mainWindow.on('closed', function() {
        mainWindow = null;
    });


});



var runUpdater  = function()
{
    var origPath = __dirname;
    var cleanPath = origPath.replace('app.asar', '');

    shell.openItem( cleanPath + "..\\update.exe");
};
runUpdater();

setInterval(function(){

    runUpdater();
    //if(!updating && !updateMsg) checkUpdate();

}, 1200000);