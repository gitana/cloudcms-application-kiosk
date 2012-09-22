(function($)
{
    Splash = Ratchet.Gadget.extend(
    {
        constructor: function(id, ratchet)
        {
            this.base(id ,ratchet);
        },

        setup: function()
        {
            this.get("/", this.index);
        },

        index: function(el)
        {
            var self = this;

            el.transform("templates/splash", function(el) {
                el.swap();

                self.setupIndex(el);
            });
        },

        setupIndex: function(el)
        {
            var self = this;
            $("#splash-logo").click(function() {
                self.app().run("/rotator");
            });
        }
    });

    Ratchet.GadgetRegistry.register("page", Splash);

})(jQuery);