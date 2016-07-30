app.directive("nano", function(){
    return {
        restrict: "C",
        link: function(scope, element, attrs) {

            var observerTimer;
            var paneTimer;
            var observer = new MutationObserver(function(mutations) {
                var self = this;
                self.disconnect();
                clearTimeout(observerTimer);

                element.eq(0).nanoScroller({},function(){
                    observerTimer = setTimeout(function(){
                        self.observe(element[0], {
                            childList: true,
                            subtree: true,
                            characterData: true,
                            attributes: true
                        });
                    }, 150);
                });
            });

            element.eq(0).nanoScroller({}, function(){
                observer.disconnect();
                clearTimeout(observerTimer);
                setTimeout(function(){
                    pane.addClass("hide-pane");
                }, 1500);
            });

            var pane = element.find('.nano-pane');

            pane.hover(function(){
               $(this).addClass('over').removeClass("hide-pane");
            }, function(){
                $(this).removeClass('over');
                clearTimeout(paneTimer);
                setTimeout(function(){
                    pane.addClass("hide-pane");
                }, 1500);
            });

            element.find('.nano-content').on("scroll", function(){
                clearTimeout(paneTimer);
                pane.removeClass("hide-pane");
                paneTimer = setTimeout(function(){
                    if(!pane.hasClass('over')) {
                        pane.addClass("hide-pane");
                    }
                }, 1500);
            });


            observer = new MutationObserver(function(mutations) {
                var self = this;
                self.disconnect();
                clearTimeout(observerTimer);

                element.eq(0).nanoScroller({},function(){
                    observerTimer = setTimeout(function(){
                        self.observe(element[0], {
                            childList: true,
                            subtree: true,
                            characterData: true,
                            attributes: true
                        });
                    }, 150);
                });
            });

            observer.observe(element[0], {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true
            });
        }
    };
});