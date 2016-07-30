var fs = require('fs');
var fse = require('fs-extra');
var asar = require('asar');
var buildify = require('buildify');


// DELETE CACHE
console.log("Deleting cache");
fse.deleteSync("compiled/mac");
fse.deleteSync("compiled/win");


/**
 * WINDOWS
 */
console.log("=== WINDOWS ===");
fse.copySync('index.html', 'compiled/win/app/index.html');
// copy main
fse.copySync('main.js', 'compiled/win/app/main.js');
fse.copySync('package.json', 'compiled/win/app/package.json');
// copy styles
fse.copySync('styles/bootstrap.css', 'compiled/win/app/styles/bootstrap.css');
fse.copySync('styles.css', 'compiled/win/app/styles.css');
// copy libs
//fse.copySync('libs/parse-1.3.5.min.js', 'compiled/win/app/libs/parse-1.3.5.min.js');
fse.copySync('libs/jquery.min.js', 'compiled/win/app/ace/jquery.min.js');
//fse.copySync('libs/bootstrap.min.js', 'compiled/win/app/libs/bootstrap.min.js');
//fse.copySync('libs/angular.min.js', 'compiled/win/app/libs/angular.min.js');
//fse.copySync('libs/moment-with-locales.min.js', 'compiled/win/app/libs/moment-with-locales.min.js');
//fse.copySync('libs', 'compiled/win/app/libs');
fse.copySync('ace', 'compiled/win/app/ace');
fse.copySync('locale', 'compiled/win/app/locale');
// copy app
fse.copySync('app/app.min.js', 'compiled/win/app/app/app.min.js');
// copy template
fse.copySync('main.html', 'compiled/win/app/main.html');
fse.copySync('login.html', 'compiled/win/app/login.html');
fse.copySync('preferences.html', 'compiled/win/app/preferences.html');
// copy fonts
fse.copySync('fonts', 'compiled/win/app/fonts');
// copy images
fse.copySync('logo.png', 'compiled/win/app/logo.png');
fse.copySync('triangle.png', 'compiled/win/app/triangle.png');
fse.copySync('offline.png', 'compiled/win/app/offline.png');
fse.copySync('close-idle.png', 'compiled/win/app/close-idle.png');
fse.copySync('minimize-idle.png', 'compiled/win/app/minimize-idle.png');
fse.copySync('maximize-idle.png', 'compiled/win/app/maximize-idle.png');
fse.copySync('themes', 'compiled/win/app/themes');
// copy modules
fse.copySync('node_modules/electron-toaster', 'compiled/win/app/node_modules/electron-toaster');

asar.createPackage('compiled/win/app', 'compiled/win/app.asar', function() {
  console.log('ASAR done.');
  fse.deleteSync("compiled/win/app/");
  fse.deleteSync("/Users/Synapse/Downloads/electron-v0.25.1-darwin-x64/Electron.app/Contents/Resources/app.asar");
  fse.copySync('compiled/win/app.asar', '/Users/Synapse/Downloads/electron-v0.25.1-darwin-x64/Electron.app/Contents/Resources/app.asar');
  //fse.deleteSync("/Volumes/C/Users/IEUser/Desktop/electron-v0.30.2-win32-ia32/resources/app.asar");
  //fse.copySync('compiled/win/app.asar', '/Volumes/C \1/Users/IEUser/Desktop/electron-v0.30.2-win32-ia32/resources/app.asar');
});



/**
 * MAC
 */
console.log("=== MAC ===");

// COMPILE HTML
var compileHTML = fs.readFileSync("compile.html").toString();
var mainHTML    = fs.readFileSync("main.html").toString();
var loginHTML   = fs.readFileSync("login.html").toString();
var prefsHTML   = fs.readFileSync("preferences.html").toString();

compileHTML     = compileHTML.replace('<!--MAIN-->', mainHTML);
compileHTML     = compileHTML.replace('<!--LOGIN-->', loginHTML);
compileHTML     = compileHTML.replace('<!--PREFERENCES-->', prefsHTML);

// COMBINE APP
var appSRC      = fs.readFileSync("app/app.min.js", "utf8").toString();

// COMPILE CSS
var compileCSS  = fs.readFileSync("styles.css").toString();
var compileBOOTSTRAP = fs.readFileSync("styles/bootstrap.css").toString();

compileHTML     = compileHTML.replace('<!--APPSECTION-->', appSRC);
compileHTML     = compileHTML.replace('<!--STYLE-->', compileCSS);
compileHTML     = compileHTML.replace('<!--BOOTSTRAP-->', compileBOOTSTRAP);
fs.writeFileSync("debug.html", compileHTML);
var compileHTML64 = new Buffer(compileHTML).toString('base64');
var compileHTMLh = '#define HTML @"' + compileHTML64 + '"';

fs.mkdirSync("compiled/mac/");
fs.writeFileSync("compiled/mac/html.h", compileHTMLh);

console.log("Compile finished");
