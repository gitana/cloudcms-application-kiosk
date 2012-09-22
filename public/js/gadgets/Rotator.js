(function($)
{
    Rotator = Ratchet.Gadget.extend(
    {
        constructor: function(id, ratchet)
        {
            this.base(id ,ratchet);
        },

        setup: function()
        {
            this.get("/rotator", this.index);
            this.get("/rotator/**", this.index);
        },

        index: function(el)
        {
            var self = this;

            el.transform("templates/rotator", function(el) {
                el.swap();

                self.setupRotator(el);
            });
        },

        setupRotator: function(el)
        {
            var self = this;

            /*
            var getURL = function()
            {
                return window.location.href.split('#').shift();
            };
            */

            // authenticate using test client to test auth grant
            new Gitana().authenticate({
                "username": "app",
                "password": "app"
            }).then(function() {

                // NOTE: this = platform

                $('.items').roundabout({
                    "enableDrag": true,

                    "tilt": -4.5,
                    "minScale": 0.3,
                    "minOpacity": 0.5,
                    "duration": 600,
                    "easing": "easeOutQuad",
                    "dropEasing": "easeOutBounce",
                    "responsive": true,
                    "clickToFocusCallback": function() {

                        $('embed').remove();
                        $('body').append('<embed src="wav/button-19.wav" autostart="true" hidden="true" loop="false">');

                        // NOTE: this = ul.items

                        var slug = $(".roundabout-in-focus", this).attr("slug");

                        //window.location.href = getURL() + "#/rotator/item/" + slug;

                        //self.app().run("/rotator/item/" + slug);

                        // TODO: how do to this?
                    }
                }, function() {

                    // this one gets run once?
                    $(this).fadeTo(500, 1);

                });

                $('.roundabout-moveable-item').live('click',function(e) {

                    // pop up into a viewer
                    //window.location.href ="../app2";

                });

                // insight
                $(".track", el).insight(this);

            });
        }
    });

    Ratchet.GadgetRegistry.register("page", Rotator);

})(jQuery);