app.factory('Bridge',["$rootScope", "$translate", function($rootScope, $translate){

    var self = {};

    self.quit = function()
    {
        if(typeof MacGap !== 'undefined')
        {
            //MacGap.terminate();
            MacGap.App.hide();
        } else if(typeof require === 'function'){
            require('nw.gui').Window.get().close();
        }
    };

    self.minimize = function()
    {
        if(typeof MacGap !== 'undefined')
        {
            MacGap.Window.minimize();
        } else if(typeof require === 'function'){
            var remote = require('remote');
            remote.getCurrentWindow().minimize();
        }
    };

    self.maximize = function()
    {
        if(typeof MacGap !== 'undefined')
        {
            MacGap.Window.maximize();
        } else if(typeof require === 'function'){
            require('nw.gui').Window.get().maximize();
        }
    };

    self.alert = function(title, message, style, button, callback)
    {
        if(typeof MacGap !== 'undefined')
        {
            var obj = {
                title: title,
                message: message,
                style: style,
                callback: callback
            };

            if(!$rootScope.online){
                obj.modal = true;
            }

            MacGap.Dialog.alertDialog(obj);
        } else {
            bootbox.alert({
                title: title,
                message: "<div class='" + style + "'></div><span class='weight400'>"+ message +"</span>"
            });
        }
    };

    self.prompt = function(title, message, primaryButton, secondaryButton, defaultValue, placeholder, callback)
    {
        if(typeof MacGap !== 'undefined')
        {
            var obj = {
                title: title,
                message: message,
                defaultButton: primaryButton,
                alternateButton: secondaryButton,
                default: defaultValue,
                placeholder: placeholder,
                callback: function(data){
                    callback(data.value);
                }
            };

            MacGap.Dialog.promptDialog(obj);
        } else {
            bootbox.prompt({
                title: message,
                value: defaultValue,
                callback: callback
            });
        }
    };

    self.confirm = function(title, message, primaryButton, secondaryButton, style, callback)
    {
        if(typeof MacGap !== 'undefined')
        {
            var obj = {
                title: title,
                message: message,
                defaultButton: primaryButton,
                alternateButton: secondaryButton,
                style: style,
                callback: function(data){
                    callback(data.return == 1 ? true : false);
                }
            };

            MacGap.Dialog.alertDialog(obj);
        } else {
            bootbox.confirm({
                title: title,
                message: "<div class='" +style+ "'></div><span class='weight400'>"+ message +"</span>",
                buttons: {
                    confirm: {
                        label: "&nbsp; "+ primaryButton +" &nbsp;",
                        className: "btn-primary"
                    },
                    cancel: {
                        label: secondaryButton,
                        className: "btn-default"
                    }
                },
                callback: callback
            });
        }
    };

    self.notify = function(title, content)
    {
        if(typeof MacGap !== 'undefined')
        {
            MacGap.Notify.notify({
                title: title,
                content: content,
                sound: false
            });
        } else if(typeof require !== 'undefined') {

            var ipc = require('ipc');
            var msg = {
                title : title,
                message : content
            };

            if(typeof ipc !== 'undefined')
            {
                ipc.send('electron-toaster-message', msg);
            }
        }
    };

    self.export = function(string, filename)
    {
        if(typeof MacGap !== 'undefined')
        {
            var obj = {
                title: $translate.instant('TITLE_EXPORT_SNIPPETS'),
                prompt: $translate.instant('TITLE_EXPORT'),
                message: $translate.instant('TITLE_SELECT_EXPORT_LOCATION'),
                filename: filename,
                createDirs: true,
                data: string,
                callback: function(data){
                    //console.log("Export callback", data);
                    self.alert($translate.instant('TITLE_EXPORT_SUCCESSFUL'), $translate.instant('MESSAGE_EXPORT_SUCCESSFUL') + data.filePath);
                }
            };

            MacGap.Dialog.exportDialog(obj);

        } else if(typeof require !== 'undefined') {

            var remote = require('remote');
            var dialog = remote.require('dialog');
            dialog.showSaveDialog(remote.getCurrentWindow(), {
                title: $translate.instant('TITLE_EXPORT_SNIPPETS'),
                defaultPath: filename
            }, function(path){
                if(typeof path === 'undefined') return;

                var fs = remote.require('fs');
                fs.writeFile(path, string, function(err) {
                    if(err) {
                        self.alert($translate.instant('TITLE_EXPORT_ERROR'), $translate.instant('MESSAGE_EXPORT_ERROR'), "error");
                        return;
                    }

                    self.alert($translate.instant('TITLE_EXPORT_SUCCESSFUL'), $translate.instant('MESSAGE_EXPORT_SUCCESSFUL') + path);
                });
            });
        }
    };

    return self;

}]);
