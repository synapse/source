app.factory("User", ["$rootScope", "Editor", "MSG", "Bridge", "$location", "$translate", "$window",
    function($rootScope, Editor, MSG, Bridge, $location, $translate, $window){

    var self = {
        username: null,
        password: null,
        loggingIn: false,
        activating: false,
        registering: false,
        preferences: {
            autosave: true,
            notifications: true
        },
        step: 1
    };

    var ace = {
        showGutter: true,
        tabSize: '4',
        theme: 'monokai',
        fontSize: '12px',
        softWraps: "free",
        useSoftTab: true,
        showIndentGuides: true,
        highlightActiveLine: false,
        showInvisibles: false,
        displayIndentGuides: true,
        useWorker: true,
        fontFamily: 'monaco',
        visibleModes: {
            html: true,
            c_cpp: true,
            java: true,
            objectivec: true,
            css: true,
            javascript: true,
            ruby: true,
            php: true,
            plain_text: true
        }
    };

    if(Parse.User.current()){
        self.preferences = Parse.User.current().get('preferences');
        Editor.setSettings(self.preferences.ace);
    }


    self.login = function(callback)
    {
        self.loggingIn = true;

        Parse.User.logIn(self.username, self.password, {
            success: function(user) {

                var payWin = user.get('payWin');
                if(typeof payWin === 'undefined' || (typeof payWin === 'boolean' && payWin === false))
                {
                    if($rootScope.OS !== 'MacIntel' && typeof require !== 'undefined')
                    {
                        self.logout();
                        $rootScope.$applyAsync(function() {
                            self.step = 4;
                        });
                        Bridge.alert($translate.instant('TITLE_ACTIVATION_REQUIRED'), $translate.instant('MESSAGE_ACTIVATION_REQUIRED'));
                    }
                }

                $rootScope.$applyAsync(function() {
                    self.loggingIn = false;
                });

                self.preferences = user.get('preferences');
                if(self.preferences){
                    Editor.setSettings(self.preferences.ace);
                } else {
                    self.preferences.ace = ace;
                    self.savePrefs();
                }


                if(typeof callback === 'function')
                {
                    callback();
                }
            },
            error: function (user, error) {

                $rootScope.$applyAsync(function() {
                    self.loggingIn = false;
                });

                console.log(error);

                Bridge.alert($translate.instant('TITLE_LOGIN_ERROR'), $translate.instant('ERROR_' + error.code) + " " + $translate.instant('MESSAGE_LOGIN_ERROR'), "warning");

                $('#loginModal').modal('show');
            }
        });
    };

    self.logout = function(callback)
    {
        console.log("Executing logout");
        Parse.User.logOut();

        if(typeof callback === 'function')
        {
            $rootScope.$applyAsync(function() {
                callback();
            });
        } else {
            $rootScope.$applyAsync(function() {
                $location.path("login");
            });
        }

        $rootScope.$applyAsync(function() {
            $rootScope.$broadcast("resetData");
            self.username = null;
            self.password = null;
            self.loggingIn = false;
            self.registering = false;
            self.preferences = {};
        });
    };

    self.register = function(callback)
    {
        // check name
        if(typeof self.name !== 'string' || (typeof self.name === 'string' && self.name.length === 0))
        {
            Bridge.alert($translate.instant('TITLE_MISSING_NAME'), $translate.instant('MESSAGE_MISSING_NAME'));

            return;
        }

        // check valid email
        var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(!re.test(self.username))
        {
            Bridge.alert($translate.instant('TITLE_INVALID_EMAIL'), $translate.instant('MESSAGE_INVALID_EMAIL'));
            return;
        }

        // check password
        if(typeof self.password !== 'string' || (typeof self.password === 'string' && self.password.length === 0))
        {
            Bridge.alert($translate.instant('TITLE_PASSWORD_MISSING'), $translate.instant('TITLE_PASSWORD_MISSING'));

            return;
        }

        if(self.password != self.repassword)
        {
            Bridge.alert($translate.instant('TITLE_PASSWORD_NOT_MATCH'), $translate.instant('MESSAGE_PASSWORD_NOT_MATCH'));
            return;
        }

        if(self.agreement != 1)
        {
            Bridge.alert($translate.instant('TITLE_TERMS_AND_PRIVACY'), $translate.instant('MESSAGE_TERMS_AND_PRIVACY'));

            return;
        }

        var user = new Parse.User();
        user.set("name", self.name);
        user.set("username", self.username);
        user.set("password", self.password);
        user.set("email", self.username);
        user.set("payMac", true);
        user.set("agreement", self.agreement);

        user.signUp(null, {
            success: function(user){

                $rootScope.$applyAsync(function() {
                    self.step = 1;
                    self.preferences.ace = ace;
                    self.savePrefs();
                });

                if(typeof callback === 'function')
                {
                    $rootScope.$applyAsync(function() {
                        callback();
                    });
                }

                user.setACL(new Parse.ACL(user));
                user.save(null, {
                    success: function(result){
                        console.log("User acl saved");
                    },
                    error: function (gameScore, error) {
                        console.log("User acl not saved");
                    }
                });
            },
            error: function (user, error) {
                Bridge.alert($translate.instant('TITLE_REGISTRATION_ERROR'), $translate.instant('ERROR_' + error.code) + " " + $translate.instant('TITLE_REGISTRATION_ERROR'));
            }
        });
    };

    self.recover = function(callback)
    {
        // check valid email
        var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(!re.test(self.username))
        {
            Bridge.alert($translate.instant('TITLE_INVALID_EMAIL'), $translate.instant('MESSAGE_INVALID_EMAIL'));

            return;
        }

        Parse.User.requestPasswordReset(self.username, {
            success: function () {
                if(typeof callback === 'function')
                {
                    callback();
                }

                Bridge.alert($translate.instant('TITLE_PASSWORD_RESET'), $translate.instant('MESSAGE_PASSWORD_RESET'));
            },
            error: function (error) {
                Bridge.alert($translate.instant('TITLE_RECOVER_ERROR'),  $translate.instant('ERROR_' + error.code) + " "+ $translate.instant('TITLE_RECOVER_ERROR'), "warning");
            }
        });
    };

    self.reset = function(password)
    {
        var user = self.getCurrent();
        user.set('password', password);
        user.save(null, {
            success: function (result) {
                $rootScope.$applyAsync(function() {
                    console.log("Password reset");
                    self.resetPassword = false;
                });
            },
            error: function (result, error) {
                console.log("Error", error);
            }
        });
    };

    self.getCurrent = function()
    {
        return Parse.User.current();
    };

    self.openPrefs = function()
    {
        self.preferencesBackup = self.preferences;
        $('#preferencesModal').modal('show');
    };

    self.openProfile = function()
    {
        $('#profileModal').modal('show');
    };

    self.cancelPrefs = function()
    {
        self.preferencesBackup = self.preferences;
        delete self.preferencesBackup;
    };

    self.savePrefs = function()
    {
        console.log("Saving user preferences...");

        var user = self.getCurrent();

        if($rootScope.OS == 'MacIntel'){
            user.set('macVer', $window.version);
        } else {
            user.set('winVer', $window.version);
        }

        user.set('preferences', self.preferences);
        user.save(null, {
            success: function (result) {

                if(self.preferences.notifications)
                {
                    Bridge.notify($translate.instant('TITLE_PREFERENCES_SAVED'), $translate.instant('MESSAGE_PREFERENCES_SAVED'));
                }

                Editor.setSettings(self.preferences.ace);
            },
            error: function (result, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                //alert('Failed to create new object, with error code: ' + error.message);

                Editor.setSettings(self.preferencesBackup.ace);
                delete self.preferencesBackup;
            }
        });
    };

    self.saveName = function(name)
    {
        var user = self.getCurrent();
        user.set('name', name);
        user.save(null, {
            success: function (result) {
                console.log("Name saved");
            },
            error: function (result, error) {

            }
        });
    };

    self.reloadPreferences = function()
    {
        Parse.User.current().fetch();
        var user = Parse.User.current();
        self.preferences = user.get('preferences');
        Editor.setSettings(self.preferences.ace);
    };

    self.showTerms = function(){
        bootbox.alert({
            title: $translate.instant('TITLE_PRIVACY_POLICY_AGREEMENT'),
            message: "<span class='weight400 agreementBox'><!--PRIVACY--></span>"
        });
    };

    self.activate = function()
    {
        // check valid email
        var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(!re.test(self.username))
        {
            Bridge.alert($translate.instant('TITLE_INVALID_EMAIL'), $translate.instant('MESSAGE_INVALID_EMAIL'));
            return;
        }

        self.activating = true;

        Parse.Cloud.run('activate', {
            email: self.username,
            key: self.key
        }, {
            success: function(result){
                $rootScope.$applyAsync(function() {
                    self.activating = false;
                    self.step = 1;
                });
                Bridge.alert($translate.instant('TITLE_ACTIVATION_SUCCESSFULL'), $translate.instant('MESSAGE_ACTIVATION_SUCCESSFULL'));
            },
            error: function(error){
                $rootScope.$applyAsync(function() {
                    self.activating = false;
                });
                Bridge.alert($translate.instant('TITLE_ACTIVATION_ERROR'), $translate.instant('ERROR_' + error.message) + " " + $translate.instant('MESSAGE_ACTIVATION_ERROR'), "error");
            }
        });
    };

    self.gravatar = function()
    {
        var user = self.getCurrent();
        if(user)
        {
            return window.md5(user.get('email'));
        }
    };

    self.delete = function(callback)
    {
        var user = self.getCurrent();

        user.destroy({
            success: function(myObject) {
                console.log("User deleted");
                callback();
            },
            error: function(myObject, error) {
                Bridge.alert($translate.instant('TITLE_USER'), $translate.instant('MESSAGE_USER'), "error");
            }
        });
    };

    return self;

}]);
