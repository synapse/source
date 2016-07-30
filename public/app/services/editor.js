app.factory("Editor", ["$rootScope", function($rootScope){

    var prefs = null;
    var ace = null;

    var self = {
        onLoad: function (_ace) {
            ace = _ace;

            if(prefs){
                self.setSettings(prefs);
                prefs = null;
            }
        },
        modes: [{mode: "abap", language: "Abap"}, {mode: "abc", language: "Abc"}, {mode: "actionscript", language: "ActionScript"}, {mode: "ada", language: "Ada"}, {mode: "apache_conf", language: "Apache Conf"}, {mode: "applescript", language: "Applescript"}, {mode: "asciidoc", language: "Ascii Doc"}, {mode: "assembly_x86", language: "Assembly x86"}, {mode: "autohotkey", language: "Autohotkey"}, {mode: "batchfile", language: "Batchfile"}, {mode: "c_cpp", language: "C/C++"}, {mode: "c9search", language: "C9 Search"}, {mode: "cirru", language: "Cirru"}, {mode: "clojure", language: "Clojure"}, {mode: "cobol", language: "Cobol"}, {mode: "coffee", language: "Coffee"}, {mode: "coldfusion", language: "Coldfusion"}, {mode: "csharp", language: "C#"}, {mode: "css", language: "CSS"}, {mode: "curly", language: "Curly"}, {mode: "d", language: "D"}, {mode: "dart", language: "Dart"}, {mode: "diff", language: "Diff"}, {mode: "django", language: "Django"}, {mode: "dockerfile", language: "Dockerfile"}, {mode: "dot", language: "Dot"}, {mode: "eiffel", language: "Eiffel"}, {mode: "ejs", language: "Ejs"}, {mode: "elixir", language: "Elixir"}, {mode: "elm", language: "Elm"}, {mode: "erlang", language: "Erlang"}, {mode: "forth", language: "Forth"}, {mode: "ftl", language: "Ftl"}, {mode: "gcode", language: "Gcode"}, {mode: "gherkin", language: "Gherkin"}, {mode: "gitignore", language: "Gitignore"}, {mode: "glsl", language: "Glsl"}, {mode: "golang", language: "Go"}, {mode: "groovy", language: "Groovy"}, {mode: "haml", language: "Haml"}, {mode: "handlebars", language: "Handlebars"}, {mode: "haskell", language: "Haskell"}, {mode: "haxe", language: "Haxe"}, {mode: "html_ruby", language: "HTML Ruby"}, {mode: "html", language: "HTML"}, {mode: "ini", language: "Ini"}, {mode: "io", language: "Io"}, {mode: "jack", language: "Jack"}, {mode: "jade", language: "Jade"}, {mode: "java", language: "Java"}, {mode: "javascript", language: "JavaScript"}, {mode: "json", language: "Json"}, {mode: "jsoniq", language: "Jsoniq"}, {mode: "jsp", language: "Jsp"}, {mode: "jsx", language: "Jsx"}, {mode: "julia", language: "Julia"}, {mode: "latex", language: "Latex"}, {mode: "lean", language: "Lean"}, {mode: "less", language: "Less"}, {mode: "liquid", language: "Liquid"}, {mode: "lisp", language: "Lisp"}, {mode: "livescript", language: "Livescript"}, {mode: "logiql", language: "Logiql"}, {mode: "lsl", language: "Lsl"}, {mode: "lua", language: "Lua"}, {mode: "luapage", language: "Luapage"}, {mode: "lucene", language: "Lucene"}, {mode: "makefile", language: "Makefile"}, {mode: "markdown", language: "Markdown"}, {mode: "mask", language: "Mask"}, {mode: "matlab", language: "Matlab"}, {mode: "maze", language: "Maze"}, {mode: "mel", language: "Mel"}, {mode: "mushcode", language: "Mushcode"}, {mode: "mysql", language: "Mysql"}, {mode: "nix", language: "Nix"}, {mode: "objectivec", language: "Objective-C"}, {mode: "ocaml", language: "Ocaml"}, {mode: "pascal", language: "Pascal"}, {mode: "perl", language: "Perl"}, {mode: "pgsql", language: "Pgsql"}, {mode: "php", language: "PHP"}, {mode: "plain_text", language: "Plain Text"}, {mode: "powershell", language: "Powershell"}, {mode: "praat", language: "Praat"}, {mode: "prolog", language: "Prolog"}, {mode: "properties", language: "Properties"}, {mode: "protobuf", language: "Protobuf"}, {mode: "python", language: "Python"}, {mode: "r", language: "R"}, {mode: "rdoc", language: "Rdoc"}, {mode: "rhtml", language: "Rhtml"}, {mode: "ruby", language: "Ruby"}, {mode: "rust", language: "Rust"}, {mode: "sass", language: "Sass"}, {mode: "scad", language: "Scad"}, {mode: "scala", language: "Scala"}, {mode: "scheme", language: "Scheme"}, {mode: "scss", language: "Scss"}, {mode: "sh", language: "Sh"}, {mode: "sjs", language: "Sjs"}, {mode: "smarty", language: "Smarty"}, {mode: "snippets", language: "Snippets"}, {mode: "soy_template", language: "Soy Template"}, {mode: "space", language: "Space"}, {mode: "sql", language: "SQL"}, {mode: "sqlserver", language: "SQL Server"}, {mode: "stylus", language: "Stylus"}, {mode: "svg", language: "Svg"}, {mode: "swift", language: "Swift"}, {mode: "tcl", language: "Tcl"}, {mode: "tex", language: "Tex"}, {mode: "text", language: "Text"}, {mode: "textile", language: "Textile"}, {mode: "toml", language: "Toml"}, {mode: "twig", language: "Twig"}, {mode: "typescript", language: "TypeScript"}, {mode: "vala", language: "Vala"}, {mode: "vbscript", language: "Vb Script"}, {mode: "velocity", language: "Velocity"}, {mode: "verilog", language: "Verilog"}, {mode: "vhdl", language: "Vhdl"}, {mode: "xml", language: "Xml"}, {mode: "xquery", language: "Xquery"}, {mode: "yaml", language: "Yaml"}],
        visibleModes: {},
        themes: {
            chrome: 'Chrome',
            clouds: 'Clouds',
            crimson_editor: 'Crimson Editor',
            dawn: 'Dawn',
            dreamweaver: 'Dreamweaver',
            eclipse: 'Eclipse',
            github: 'GitHub',
            katzenmilch: 'KatzenMilch',
            kuroir: 'Kuroir',
            solarized_light: 'Solarized Light',
            textmate: 'TextMate',
            tomorrow: 'Tomorrow',
            xcode: 'XCode',
            //iplastic: 'iPlastic',
            //sqlserver: 'SQL Server',
            ambiance: 'Ambiance',
            chaos: 'Chaos',
            clouds_midnight: 'Clouds Midnight',
            cobalt: 'Cobalt',
            idle_fingers: 'Idle Fingers',
            krtheme: 'krTheme',
            merbivore: 'Merbivore',
            merbivore_soft: 'Merbivore Soft',
            mono_industrial: 'Mono Industrial',
            monokai: 'Monokai',
            pastel_on_dark: 'Pastel on Dark',
            solarized_dark: 'Solarized Dark',
            terminal: 'Terminal',
            tomorrow_night: 'Tomorrow Night',
            tomorrow_night_80s: 'Tomorrow Night 80\'s',
            tomorrow_night_blue: 'Tomorrow Night Blue',
            tomorrow_night_bright: 'Tomorrow Night Bright',
            twilight: 'Twilight',
            vibrant_ink: 'Vibrant Ink'
        }
    };

    self.setSettings = function(settings)
    {
        if(!ace){
            prefs = settings;
            return;
        }

        if(!settings) return;

        $rootScope.$applyAsync(function(){
            angular.forEach(Object.keys(settings), function(key){

                //console.log("Setting", key, settings[key]);

                if(key == 'tabSize') ace.getSession().setTabSize(parseInt(settings[key]));
                if(key == 'fontSize') ace.container.style.fontSize = settings[key];
                if(key == 'softWraps') ace.setOption("wrap", settings[key]);
                if(key == 'selectionStyle') ace.setOption("selectionStyle", settings[key]);
                if(key == 'highlightActiveLine') ace.setOption("highlightActiveLine", settings[key]);
                if(key == 'displayIndentGuides') ace.setDisplayIndentGuides(settings[key]);
                if(key == 'useSoftTab') ace.getSession().setUseSoftTabs(settings[key]);
                if(key == 'highlightSelectedWord') ace.setHighlightSelectedWord(settings[key]);
                if(key == 'useWorker') ace.setOption("useWorker", ((settings[key] == 'false') ? false : true) );
                if(key == 'fontFamily'){
                    var fontFamily = 'monaco';
                    if(
                        typeof settings[key] === 'undefined' ||
                        settings[key] === null ||
                        (typeof settings[key] === 'string' && settings[key].length == 0)
                    ){
                        fontFamily = 'monaco';
                    } else {
                        fontFamily = settings[key];
                    }

                    ace.setOption("fontFamily", fontFamily);
                }

                self[key] = settings[key];
            });
        });
    };

    return self;

}]);
