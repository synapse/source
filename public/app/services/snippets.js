var snippetsModel = Parse.Object.extend("Snippets");
var snippetsQuery = new Parse.Query(snippetsModel);
snippetsQuery.limit(1000);
snippetsQuery.include("snippetGroup");

var groupsModel = Parse.Object.extend("Groups");
var groupsQuery = new Parse.Query(groupsModel);
groupsQuery.limit(1000);

app.factory("Snippets", ["$rootScope", "User", "Snippet", "Group", "Editor", "Bridge", "MSG", "$window", "$translate", "$filter",
    function($rootScope, User, Snippet, Group, Editor, Bridge, MSG, $window, $translate, $filter){

    var self = {
        snippets: [],
        groups: [],
        selected: null,
        selectedName: null,
        selectedType: null,
        selectedCode: null,
        selectedGroup: null,
        counter: {
            total: 0
        },
        tags: {},
        filters: {
            queryQ: null,
            queryG: null,
            queryT: []
        },
        loadingSnippets: false,
        loadingGroups: false,
        lastSync: null
    };

    self.loadSnippets = function()
    {
        self.loadingSnippets = true;

        snippetsQuery.find({
            success: function(results) {

                // reset the groups only if
                // everything is ok
                self.snippets = [];
                var snippets = [];

                // reset the counters so that
                // the numbers don't increase
                // every time the app reconnects
                self.counter = {
                    total: 0
                };

                angular.forEach(results, function(result){

                    var snippet = new Snippet(result);

                    if(typeof result.get('snippetGroup') === 'undefined') {
                        self.increaseCounter("sharedwithme");
                        snippets.push(snippet);
                        return;
                    } else {
                        self.increaseCounter(result.get('snippetGroup').id);
                    }

                    snippets.push(snippet);
                });

                self.lastSync = new Date();

                $rootScope.$applyAsync(function(){
                    self.snippets = snippets;
                    self.loadingSnippets = false;
                    self.reloadTags();
                });
            },
            error: function (error) {
                console.log("Error", error);

                Bridge.alert($translate.instant('TITLE_SNIPPETS'), $translate.instant('ERROR_' + error.code)+ " " + $translate.instant('MESSAGE_SNIPPETS_3'), "error");

                $rootScope.$applyAsync(function(){
                    self.loadingSnippets = false;
                });
            }
        });
    };

    setTimeout(function(){
        console.log(self);
    }, 4000);

    self.loadGroups = function()
    {
        self.loadingGroups = true;

        groupsQuery.find({
            success: function(results) {

                // reset the groups only if
                // everything is ok
                self.groups = [];
                var groups = [];

                angular.forEach(results, function(result){
                    var group = new Group(result);
                    groups.push(group);
                });

                //groups.push({
                //    id: "sharedwithme",
                //    name: "Shared with me"
                //});

                $rootScope.$applyAsync(function(){
                    self.groups = groups;
                    self.loadingGroups = false;
                });

                self.lastSync = new Date();

                //self.loadSnippets();
            },
            error: function (error) {
                console.log("Error", error);

                Bridge.alert($translate.instant('TITLE_GROUPS'), $translate.instant('ERROR_' + error.code) + " " + $translate.instant('MESSAGE_GROUPS'), "error");

                $rootScope.$applyAsync(function(){
                    self.loadingGroups = false;
                });
            }
        });
    };

    self.newGroup = function()
    {
        Bridge.prompt($translate.instant('TITLE_NEW_GROUP'), $translate.instant('MESSAGE_NEW_GROUP'), $translate.instant('SAVE'), $translate.instant('CANCEL'), $translate.instant('UNTITLED_GROUP'), $translate.instant('GROUP_NAME'), function(group){
            if(group && typeof group === 'string' && group.length > 0){
                var newGroup = new groupsModel();
                newGroup.set('groupName', group);
                newGroup.setACL(new Parse.ACL(User.getCurrent()));

                newGroup.save(null, {
                    success: function (result) {
                        if(User.preferences.notifications)
                        {
                            Bridge.notify($translate.instant('MESSAGE_GROUP_SAVED'), result.get('groupName'));
                        }

                        var group = new Group(result);

                        $rootScope.$applyAsync(function() {
                            self.groups.push(group);
                            //self.groups.splice(self.groups.length - 1, 0, group);
                        });
                    },
                    error: function (result, error) {
                        console.log(error);

                        Bridge.alert($translate.instant('TITLE_GROUP'), $translate.instant('ERROR_' + error.code) + " "+ $translate.instant('MESSAGE_GROUP'), "error");
                    }
                });
            }
        });
    };

    self.editGroup = function(group)
    {
        bootbox.prompt({
            title: $translate.instant('TITLE_ENTER_GROUP_NAME'),
            value: group.name,
            callback: function(name) {
                if(name && typeof name === 'string' && name.length > 0){

                    $rootScope.$applyAsync(function() {
                        self.groups[self.groups.indexOf(group)].name = name;
                    });

                    group.group.set("groupName", name);
                    group.group.save(null, {
                        success: function (result) {
                            console.log("Group save successfully", result);
                        },
                        error: function (result, error) {
                            console.log(error);

                            Bridge.alert($translate.instant('TITLE_GROUP'), $translate.instant('ERROR_' + error.code) + " " + $translate.instant('MESSAGE_GROUP_2'), "error");
                        }
                    });
                }
            }
        });
    };

    self.deleteGroup = function(group)
    {
        Bridge.confirm($translate.instant('TITLE_DELETE_GROUP'), $translate.instant('MESSAGE_DELETE_GROUP'), $translate.instant('YES'), $translate.instant('NO'), undefined, function(result){
            if(result){
                group.group.destroy({
                    success: function(result) {
                        var index = self.groups.indexOf(group);
                        $rootScope.$applyAsync(function() {
                            self.groups.splice(index, 1);
                        });

                        //self.decreaseCounter(group.id);
                        delete self.counter[group.id];

                        if(self.filters.queryG == group.id){
                            self.filters.queryG = null;
                        }

                        var snippets = [];
                        var snippetsDelete = [];
                        angular.forEach(self.snippets, function (snippet) {
                            if (snippet.group.id == group.group.id) {
                                snippets.push(snippet.snippet);
                                snippetsDelete.push(snippet);
                            }
                        });

                        angular.forEach(snippetsDelete, function (snippet) {
                            var index = self.snippets.indexOf(snippet);

                            self.snippets.splice(index, 1);
                            self.decreaseCounter(snippet.group.id);

                            if (self.selected == snippet) {
                                $rootScope.$applyAsync(function () {
                                    self.selected = null;
                                });
                            }
                        });

                        Parse.Object.destroyAll(snippets).then(function(success) {
                            console.log("Snippets deleted");
                        }, function(error) {
                            console.error("Oops! Something went wrong: " + error.message + " (" + error.code + ")");
                            Bridge.alert($translate.instant('TITLE_SNIPPETS'), $translate.instant('ERROR_' + error.code) + " " + $translate.instant('MESSAGE_SNIPPETS'), "error");
                        });
                    },
                    error: function (myObject, error) {
                        console.log(error);
                        Bridge.alert($translate.instant('TITLE_GROUP'), $translate.instant('ERROR_' + error.code) + " " + $translate.instant('MESSAGE_GROUP_3'), "error");
                    }
                });
            }
        });
    };

    self.deleteAll = function(callback)
    {
        var finished = false;
        var snippets = [];
        angular.forEach(self.snippets, function (snippet){
            snippets.push(snippet.snippet);
        });

        Parse.Object.destroyAll(snippets).then(function(success) {
            console.log("Snippets deleted");
            if(!finished){
                finished = true;
                return;
            }

            callback();
        }, function(error) {
            Bridge.alert($translate.instant('TITLE_SNIPPETS'), $translate.instant('MESSAGE_SNIPPETS_2'), "error");
        });

        var groups = [];
        angular.forEach(self.groups, function (group){
            groups.push(group.group);
        });

        Parse.Object.destroyAll(groups).then(function(success) {
            console.log("Groups deleted");
            if(!finished){
                finished = true;
                return;
            }

            callback();
        }, function(error) {
            Bridge.alert($translate.instant('TITLE_GROUPS'), $translate.instant('MESSAGE_GROUPS_2'), "error");
        });
    };

    self.newSnippet = function(group)
    {
        Editor.setSettings({
            mode: 'plain_text'
        });

        var newSnippet = new snippetsModel();
        newSnippet.set('snippetName', $translate.instant('UNTITLED_SNIPPET'));
        newSnippet.set('snippetType', 'plain_text');
        newSnippet.set('snippetCode', '');

        if(group){
            angular.forEach(self.groups, function(grp){
                if(grp.id == group) {
                    newSnippet.set('snippetGroup', grp.group);
                    self.increaseCounter(grp.id);
                }
            });
        }

        newSnippet.setACL(new Parse.ACL(User.getCurrent()));

        var snippet = new Snippet(newSnippet);

        self.snippets.push(snippet);
        self.selected = snippet;

        // focus on the title
        setTimeout(function(){
            $('.snippetTitle')[0].focus();
            $('.snippetTitle')[0].select();
        }, 500);
    };

    self.deleteSnippet = function(snippet)
    {
        Bridge.confirm($translate.instant('TITLE_DELETE_SNIPPET'), $translate.instant('MESSAGE_DELETE_SNIPPET'), $translate.instant('YES'), $translate.instant('NO'), undefined, function(result) {
            if(result){
                // if the snippet is already saved in the db
                if(typeof snippet.snippet.id !== 'undefined') {
                    snippet.snippet.destroy({
                        success: function (result) {
                            var index = self.snippets.indexOf(snippet);
                            $rootScope.$applyAsync(function() {
                                self.snippets.splice(index, 1);
                                self.reloadTags();
                            });

                            if(typeof snippet.group !== 'undefined') {
                                self.decreaseCounter(snippet.group.id);
                            } else {
                                self.decreaseCounter('sharedwithme');
                            }

                            if(self.selected == snippet){
                                $rootScope.$applyAsync(function(){
                                    self.selected = null;
                                });
                            }
                        },
                        error: function (myObject, error) {
                            console.log(error);

                            Bridge.alert($translate.instant('TITLE_SNIPPET'), $translate.instant('ERROR_' + error.code) + " " + $translate.instant('MESSAGE_SNIPPET'), "error");
                        }
                    });

                // else if it's a newly created snippet
                } else {
                    var index = self.snippets.indexOf(snippet);
                    self.snippets.splice(index, 1);

                    if(typeof snippet.group !== 'undefined') {
                        self.decreaseCounter(snippet.group.id);
                    }

                    if(self.selected == snippet){
                        $rootScope.$applyAsync(function(){
                            self.selected = null;
                        });
                    }
                }
            }
        });
    };

    self.increaseCounter = function(group)
    {
        if(!self.counter[group]) self.counter[group] = 0;

        self.counter[group]++;
        self.counter.total++;
    };

    self.decreaseCounter = function(group)
    {
        self.counter[group]--;
        self.counter.total--;

        if(self.counter.total < 0) self.counter.total = 0;
        if(self.counter[group] < 0) self.counter[group] = 0;
    };

    self.sync = function()
    {
        var now = new Date();
        var diff = Math.abs(now - self.lastSync);
        var minutes = Math.floor((diff/1000)/60);

        if(minutes < 1){
            Bridge.alert($translate.instant('TITLE_SYNC'), $translate.instant('MESSAGE_SYNC'));
            return;
        }

        self.counter = {
            total: 0
        };

        self.filters = {
            queryQ: null,
            queryG: null,
            queryT: []
        };

        self.lastSync = now;

        self.loadGroups();
        self.loadSnippets();
        User.reloadPreferences();
    };

    self.share = function(data, callback)
    {
        // check valid email
        var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(!re.test(data.mail))
        {
            Bridge.alert($translate.instant('TITLE_INVALID_EMAIL'), $translate.instant('MESSAGE_INVALID_EMAIL'));
            callback(false);
            return;
        }

        var user = User.getCurrent();
        if(data.mail == user.get('username'))
        {
            Bridge.alert($translate.instant('TITLE_YOU_OWN_SNIPPET'), $translate.instant('MESSAGE_YOU_OWN_SNIPPET'));
            callback(false);
            return;
        }

        Parse.Cloud.run('share', {
            email: data.mail,
            snippet: self.selected.snippet.id
        }, {
            success: function(result){
                Bridge.alert($translate.instant('TITLE_SHARE_SUCCESSFUL'), $translate.instant('MESSAGE_SHARE_SUCCESSFUL'));
                callback(true);
            },
            error: function(error){
                Bridge.alert($translate.instant('TITLE_SHARE_ERROR'), $translate.instant('ERROR_' + error.message) + " " + $translate.instant('MESSAGE_SHARE_ERROR'), "error");

                callback(false);
            }
        });
    };

    self.getTags = function($query)
    {
        var tags = [];
        for(var tag in self.tags){
            if(tag.toLowerCase().indexOf($query.toLowerCase()) != -1) {
                tags.push({
                    text: tag
                });
            }
        }
        return tags;
    };

    self.hasTags = function()
    {
        return (Object.keys(self.tags).length > 0) ? true : false;
    };

    self.reloadTags = function()
    {
        self.tags = {};
        angular.forEach(self.snippets, function(snippet){
            if(
                typeof snippet.tags !== 'undefined' &&
                Array.isArray(snippet.tags) &&
                snippet.tags.length > 0
            ){
                angular.forEach(snippet.tags, function(tag){
                    if(typeof self.tags[tag.text] !== 'undefined'){
                        self.tags[tag.text]++;
                    } else {
                        self.tags[tag.text] = 1;
                    }
                });
            }
        });

        if(
            angular.isArray(self.filters.queryT) &&
            self.filters.queryT.length > 0
        )
        {
            angular.forEach(self.filters.queryT, function(tag){
                if(typeof self.tags[tag] === 'undefined') // should remove the tag filter
                {
                    self.filters.queryT.splice(self.filters.queryT.indexOf(tag), 1);
                }
            });
        }
    };

    self.export = function(type)
    {
        console.log('Export shit', type);
        if(self.filters.queryG){
            //$translate.instant('TITLE_EXPORT_SNIPPETS')
            Bridge.confirm(
                $translate.instant('TITLE_EXPORT_SNIPPETS'), 
                $translate.instant('MESSAGE_EXPORT_SELECTION'), 
                $translate.instant('LABEL_SELECTED_ONLY'), 
                $translate.instant('LABEL_EVERYTHING'),
                undefined, function(result) {
                    
                if(result){
                    self._export(type, $filter('group')(self.groups, self.filters.queryG));
                } else {
                    self._export(type, self.groups);
                }
            });     
        } else {
            self._export(type, self.groups);
        }
    };

    self._export = function(type, groups)
    {
        var now = moment().format('YYYYMMDD-HHmmss');

        // export JSON
        if(type == 'json') {
            var data = [];
            angular.forEach(groups, function(group){

                var Group = {
                    group: group.name,
                    createdAt: group.createdAt,
                    updatedAt: group.updatedAt,
                    snippets: []
                };

                angular.forEach(self.snippets, function(snippet){

                    if(snippet.group.id == group.id){
                        var Snippet = {
                            snippet: snippet.name,
                            code: snippet.code,
                            type: snippet.type,
                            tags: snippet.tags || [],
                            createdAt: snippet.createdAt,
                            updatedAt: snippet.updatedAt
                        };

                        Group.snippets.push(Snippet);
                    }
                });

                data.push(Group);
            });

            Bridge.export(JSON.stringify(data, null, "\t"), 'Source Export ('+now+').json');
        }

        // export HTML
        if(type == 'html') {
            var htmlEntities = function(str) {
                return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            };

            var categories = $('<div class="categories"></div>');
            angular.forEach(groups, function(group){
                var category = $('<section class="category"><h2>'+ group.name +'</h2></section>');

                angular.forEach(self.snippets, function(snippet){
                    if(snippet.group.id == group.id){
                        var snip = $('<article class="snippet"><h4>'+snippet.name+'</h4></article>');
                        var code = $('<pre class="'+snippet.type+'"><code>'+htmlEntities(snippet.code)+'</code></pre>');
                        var tags = $('<ul class="snippet-tags"></ul>');
                        angular.forEach(snippet.tags, function(tag){
                            var tag = $('<li class="snippet-tag">'+tag.text+'</li>');
                            tags.append(tag);
                        });
                        snip.append(code);
                        snip.append(tags);
                        category.append(snip);
                    }
                });
                categories.append(category);
            });
            Bridge.export(categories.html(), 'Source Export ('+now+').html');
        }

        // export markdown
        if(type == 'md') {
            var md = "";
            angular.forEach(groups, function(group){
                md += "## "+  group.name + "\n\n";

                angular.forEach(self.snippets, function(snippet){
                    if(snippet.group.id == group.id){
                        md += "#### " + snippet.name + "\n\n";
                        md += "```" + snippet.type + "\n";
                        md += snippet.code + "\n";
                        md += "```" + "\n\n";
                        angular.forEach(snippet.tags, function(tag){
                            md += "* " + tag.text + "\n";
                        });
                        md += "\n\n\n";
                    }
                });
            });

            Bridge.export(md, 'Source Export ('+now+').md');
        }
    };

    // events
    $rootScope.$on('groupChanged', function(ev, n, o){
       if(typeof n !== 'undefined') self.increaseCounter(n.id);
       if(typeof o !== 'undefined') self.decreaseCounter(o.id);
    });

    $rootScope.$on('snippetSaved', function(ev){
       self.reloadTags();
    });

    $rootScope.$on('resetData', function(ev){
        self.snippets = [];
        self.groups = [];
        self.selected = null;
        self.selectedName = null;
        self.selectedType = null;
        self.selectedCode = null;
        self.selectedGroup = null;
        self.counter = {
            total: 0
        };
        self.filters = {
            queryQ: null,
            queryG: null,
            queryT: null
        };
        self.loadingSnippets = false;
        self.loadingGroups = false;
        self.lastSync = null;
    });

    $rootScope.$watch('online', function(status) {
        if(status === true && self.loadingGroups === false){
            var now = new Date();
            var diff = Math.abs(now - self.lastSync);
            var minutes = Math.floor((diff/1000)/60);

            if(minutes < 2){
                console.log("Returning already synced");
                return;
            }

            setTimeout(function(){
                self.loadGroups();
            }, 1000);
        }
    });


    var blurTimer = null;
    $window.onfocus = function()
    {
        clearTimeout(blurTimer);
    };
    // when window loses focus save the snippet
    $window.onblur = function()
    {
        blurTimer = setTimeout(function(){
            if(typeof self.selected !== 'undefined' && self.selected !== null && User.preferences.autosave){
                self.selected.save();
            }
        }, 60000);

    };

    return self;

}]);

app.service("Group", ["User", function(User){

    var Group = function(group)
    {
        this.group = group;
        this.name = group.get("groupName");
        this.id = group.id;
        this.createdAt = group.createdAt;
        this.updatedAt = group.updatedAt;
        this.editable = true;
    };

    return Group;

}]);

app.service("Snippet", ["User", "$rootScope", "Bridge", "MSG", '$translate', function(User, $rootScope, Bridge, MSG, $translate){

    var Snippet = function(snippet)
    {
        this.snippet = snippet;
        this.name = snippet.get('snippetName');
        this.code = snippet.get('snippetCode');
        this.type = snippet.get('snippetType');
        this.tags = snippet.get('snippetTags');
        this.notes = snippet.get('snippetNotes');
        this.createdAt = snippet.createdAt;
        this.updatedAt = snippet.updatedAt;
        this.hooks = {
            onSave: []
        };

        if(typeof snippet.get('snippetGroup') !== 'undefined') {
            this.group = snippet.get('snippetGroup');
            this.groupName = this.group.get('groupName');
            this.oldGroup = this.group;
        } else {
            if(typeof snippet.id !== 'undefined') {
                this.groupName = "Shared with me";
                this.oldGroup = {
                    id: "sharedwithme"
                };
            }
        }
    };

    Snippet.prototype.save = function()
    {
        if(!this.group)
        {
            Bridge.alert($translate.instant('TITLE_MISSING_CATEGORY'), $translate.instant('MESSAGE_MISSING_CATEGORY'));
            return;
        }

        if(
            typeof this.name === 'undefined' ||
            this.name === null ||
            (typeof this.name === 'string' && this.name.length === 0)
        ){
            Bridge.alert($translate.instant('TITLE_MISSING_SNIPPET_NAME'), $translate.instant('MESSAGE_MISSING_SNIPPET_NAME'));
            return;
        }

        var self = this;
        self.saving = true;

        self.snippet.set('snippetName', this.name);
        self.snippet.set('snippetCode', this.code);
        self.snippet.set('snippetType', this.type);
        self.snippet.set('snippetGroup', this.group);
        self.snippet.set('snippetTags', this.tags);
        self.snippet.set('snippetNotes', this.notes);

        this.snippet.save(null, {
            success: function (result) {
                self.snippet = result;
                console.log('Snippet saved');

                $rootScope.$applyAsync(function(){
                    self.saving = false;
                    self.saved = true;
                });

                setTimeout(function(){
                    $rootScope.$applyAsync(function(){
                        delete self.saved;
                    });
                }, 1000);

                if(User.preferences.notifications)
                {
                    Bridge.notify($translate.instant('MESSAGE_SNIPPET_SAVED'), self.name);
                }
                $rootScope.$broadcast('snippetSaved');
            },
            error: function (gameScore, error) {
                console.log(error);

                Bridge.alert($translate.instant('TITLE_SNIPPET'), $translate.instant('ERROR_' + error.code)+ " " + $translate.instant('MESSAGE_SNIPPET_2'), "error");

                $rootScope.$applyAsync(function(){
                    self.saving = false;
                });
            }
        });
    };

    Snippet.prototype.groupChanged = function()
    {
        this.groupName = this.group.name;
        this.group = this.group.group;

        $rootScope.$broadcast('groupChanged', this.group, this.oldGroup);
        this.oldGroup = this.group;
    };

    Snippet.prototype.addHook = function(hook, callback)
    {
        if(typeof this.hooks[hook] !== 'undefined')
        {
            this.hooks[hook].push(callback);
        }
        return this;
    };

    return Snippet;
}]);
