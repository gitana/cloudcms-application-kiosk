(function(window)
{
    Magazine = function(el, config)
    {
        // el can either be a dom id or a dom element
        if (el)
        {
            if (Magazine.isString(el)) {
                el = $("#" + el);
            }
        }

        if (!config)
        {
            config = {};
        }

        if (config.pages)
        {
            window.pages = config.pages;
        }

        var getURL = function()
        {
            return window.location.href.split('#').shift();
        };

        var getHash = function()
        {
            return window.location.hash.slice(1);
        };

        var setControllPos = function()
        {
            var view = $(el).turn('view');

            if (view[0]) $('#previous').addClass('visible');
            else $('#previous').removeClass('visible');

            if (view[1]) $('#next').addClass('visible');
            else $('#next').removeClass('visible');

        };

        var checkHash = function(hash)
        {
            var hash = getHash(), k;

            if ((k=jQuery.inArray(hash, pages))!=-1) {
                $('nav').children().each(function(index, value) {
                    if ($(value).attr('href').indexOf(hash)!=-1)
                        $(value).addClass('on');
                    else
                        $(value).removeClass('on');
                });
                return k+1;
            }

            return 1;
        };

        var rotated = function()
        {
            return Math.abs(window.orientation)==90;
        };

        var isPhone = function()
        {
            return navigator.userAgent.match(/iPhone/i);
        };

        var resizeViewport = function()
        {
            $('#viewport').css({width: $(window).width(), height: (isPhone() && !rotated()) ? 1670 :  $(document).height()});
        };

        var setScroll = function()
        {
            if (isPhone())
            {
                window.scrollTo(0, (rotated()) ? $(el).offset().top-6 : 1);
            }
        };

        var moveMagazine = function(page)
        {
            var that = $(el),
                rendered = that.data().done,
                width = that.width(),
                pageWidth = width/2,
                total = that.data().totalPages,
                options = {duration: (!rendered) ? 0 : 600, easing: 'easeInOutCubic', complete: function(){ $(el).turn('resize'); }};


            $('#controllers').stop();

            if (page==total)
                $('#shadow-page').fadeOut(0);

            if ((page==1 || page == total) && !rotated()) {

                var leftc = ($(window).width()-width)/2,
                    leftr = ($(window).width()-pageWidth)/2,
                    leftd = (page==1)? leftr - leftc - pageWidth : leftr - leftc;

                $('#controllers').animate({left: leftd}, options);

            } else {
                $('#shadow-page').fadeOut('slow');
                $('#controllers').animate({left: 0}, options);
            }
        };


        /* Turn events */
        $(el).
            bind('turning', function(e, page){

                //Let's do something amazing here

                moveMagazine(page);


            }).
            bind('turned', function(e, page, pageObj) {

                var rendered = $(this).data().done;

                if (!rendered) {
                    moveMagazine(page);
                    $('#controllers').fadeIn();
                } else {
                    jQuery.each(pages, function(index, value) {
                        if (page==index+1) {
                            var newUrl = getURL() + '#' + value;
                            window.location.href = newUrl;
                            return false;
                        }
                    });
                }

                setControllPos();

                if (page==1) $('#shadow-page').fadeIn('slow');
                else $('#shadow-page').fadeOut((rendered) ? 'slow' : 0);

                setScroll();

            }).bind('start', function(e, page) {

                if (page==2)
                    $('#previous').hide();
                else if (page==$(this).data().totalPages-1)
                    $('#next').hide();

            }).bind('end', function(e, page) {

                if (page!=1)
                    $('#previous').show();
                if (page!=$(this).data().totalPages-1)
                    $('#next').show();

            });


			
			
			
        $(window).bind('keydown', function(e){

            if (e.keyCode==37)
                $(el).turn('previous');
            else if (e.keyCode==39)
                $(el).turn('next');

        });
		
/*
		$(window).bind('hashchange', function() {

            var page = checkHash();
            $(el).turn('page', page);

        });
		
		$(window).bind('touchstart', function(e) {

            var t = e.originalEvent.touches;
            if (t[0]) touchStart = {x: t[0].pageX, y: t[0].pageY};

            touchEnd = null;

        });
		
		$(window).bind('touchmove', function(e) {

            var t = e.originalEvent.touches, pos = $(el).offset();

            if (t[0].pageX>pos.left && t[0].pageY>pos.top && t[0].pageX<pos.left+$(el).width() && t[0].pageY<pos.top+$(el).height()) {

                if (t.length==1)
                    e.preventDefault();

                if (t[0]) touchEnd = {x: t[0].pageX, y: t[0].pageY};

            }

        });
		
		$(window).bind('touchend', function(e) {

            if (window.touchStart && window.touchEnd) {
                var that = $(el),
                    w = that.width()/2,
                    d = {x: touchEnd.x-touchStart.x, y: touchEnd.y-touchStart.y},
                    pos = {x: touchStart.x-that.offset().left, y: touchStart.y-that.offset().top};

                if (Math.abs(d.y)<100)
                    if (d.x>100 && pos.x<w)
                        $(el).turn('previous');
                    else if (d.x<100 && pos.x>w)
                        $(el).turn('next');

            }
        });
		
		$(window).resize(function() {

            $(el).turn('resize');

            resizeViewport();
        });
*/		
		
		
		


        $('#next').click(function(e) {


            $(el).turn('next');
            return false;

        });

        $('#previous').click(function(e) {

            e.stopPropagation();

            $(el).turn('previous');
            return false;

        });

        $(el).children(':first').bind('flip', function() {

        }).find('p').fadeOut(0).fadeIn(2000);


        $('body').bind('orientationchange', function() {

            resizeViewport();

            setScroll();

            moveMagazine($(el).turn('page'));

        });

        /* Create internal instance */

        if ($(window).width()<=1200)
        {
            $('body').addClass('x1024');
        }

        // fire load method
        if (config.load)
        {
            config.load.call($(el));
        }

        $(el).turn({
			page: checkHash(), 
			acceleration: true, 
			shadows: !$.isTouch, 
			corners: 'all', 
			cornerSize: 350
		});

        resizeViewport();

        setScroll();
    };

    Magazine.VERSION = "0.1.0";
    Magazine.makeArray = function(nonArray) {
        return Array.prototype.slice.call(nonArray);
    };

    Magazine.isFunction = function(obj) {
        return Object.prototype.toString.call(obj) === "[object Function]";
    };
    Magazine.isString = function(obj) {
        return (typeof obj == "string");
    };
    Magazine.copyInto = function(target, source, includeFunctions) {
        for (var i in source)
        {
            if (source.hasOwnProperty(i))
            {
                if (Magazine.isFunction(source[i]))
                {
                    if (includeFunctions)
                    {
                        target[i] = source[i];
                    }
                }
                else
                {
                    target[i] = source[i];
                }
            }
        }
    };

    $.magazine = Magazine;

    $.fn.magazine = function()
    {
        var args = Magazine.makeArray(arguments);

        // append this into the front of args
        var newArgs = [].concat(this, args);

        // invoke, hand back field instance
        return Magazine.apply(this, newArgs);
    };

})(window);