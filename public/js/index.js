(function($, window)
{
    var queryStringToObject = function( qstr )
    {
        var result = {},
        nvPairs = ( ( qstr || "" ).replace( /^\?/, "" ).split( /&/ ) ),
        i, pair, n, v;

        for ( i = 0; i < nvPairs.length; i++ )
        {
            var pstr = nvPairs[ i ];
            if ( pstr )
            {
                pair = pstr.split( /=/ );
                n = pair[ 0 ];
                v = pair[ 1 ];
                if ( result[ n ] === undefined )
                {
                    result[ n ] = v;
                }
                else
                {
                    if ( typeof result[ n ] !== "object" )
                    {
                        result[ n ] = [ result[ n ] ];
                    }

                    result[ n ].push( v );
                }
            }
        }

        return result;
    };

    var getQueryString = function()
    {
        var queryString = {};
        if (window.location.href.indexOf("?") > -1)
        {
            var s = window.location.href.substring(window.location.href.indexOf("?") + 1);
            queryString = queryStringToObject(s);
        }

        return queryString;
    };



    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // PAGES
    //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////

    $("#splash").live("pageinit", function(event)
    {
        $("#splash-logo").click(function(evt) {

            $.mobile.changePage("#signin", {
                "transition": "pop",
                "role": "dialog"
            });

            evt.preventDefault();
            return false;
        });
    });

    $("#signin").live("pageinit", function(event)
    {
        $("#signinform").submit(function(evt) {

            handleLogin(function() {

                // succeeded
                $.mobile.changePage("#rotator", {
                    "transition": "pop"
                });

            }, function(message) {

                $("<div>").simpledialog2({
                    mode: "blank",
                    //headerText: "Alas, there was a problem...",
                    themeDialog: "a",
                    themeInput: "a",
                    showModal: true,
                    //headerClose: true,
                    //dialogAllow: true,
                    //dialogForce: true,
                    blankContent : "<div align='center'><br/><br/>" + message + "<br/><br/><a rel='close' data-role='button' href='#'>Close</a></div>"
                });
            });

            evt.preventDefault();
            return false;
        });
    });

    /*
    $("#rotator").live("pagebeforeshow", function(evt)
    {
        if (!Kiosk.isUserLoaded())
        {
            Kiosk.redirectToStart();
            evt.preventDefault();
            return false;
        }
    });
    */

	$("#rotator").live("pagebeforeshow", function(evt)
	{
		$(".items").empty();
		$('.roundabout-moveable-item').remove();
	});
	
    $("#rotator").live("pageshow", function(event)
    {
        /** NOTE: called with this == gitana platform **/
        var render2 = function()
        {
			Kiosk.mode = "rotator";

            applyUserState();

            // empty the items
            $(".items").empty();
			$('.roundabout-moveable-item').remove();

			var startingIndex = 0;
			
            // walk all of the items and append them
            for (var i = 0; i < Kiosk.items.length; i++)
            {
                var item = Kiosk.items[i];

                var key = item.key;
                var title = item.title;
                var insightnode = item.node;
                var imageUrl = item.imageUrl;
                //var url = item.url;

                $(".items").append("<li class='item track' key='" + key + "' keyIndex='" + i + "' insightnode='" + insightnode + "'><img src='" + imageUrl + "'><h2>" + title + "</h2></li>");

                // if no key specified on the request parameter, then we adjust so we've picked the first one
                if (!getQueryString().key)
                {
                    window.location.hash = "#rotator?key=" + key;
                }
				else
				{
					var index = Kiosk.findItemIndex(getQueryString().key);
					if (index > -1)
					{
						//$(".items").roundabout("animateToChild", index);
						startingIndex = index;
					}
				}
            }

            $(".items").roundabout({
                "enableDrag": true,
				"dragFactor": 10,
				
				"startingChild": startingIndex,

                "tilt": -4.5,
                "minScale": 0.3,
                "minOpacity": 0.5,
                "duration": 800,
                "easing": "easeOutQuad",
                "dropEasing": "easeOutBounce",
                "responsive": true,
                "clickToFocusCallback": function() {

                    // NOTE: this = ul.items

                    var key = $(".roundabout-in-focus", this).attr("key");

                    window.location.hash = "#rotator?key=" + key;

                }

            });

            $('.roundabout-moveable-item').bind('click',function(e) {

				// if this is the currently selected item...
				if ($(this).hasClass("roundabout-in-focus"))
				{
					var key = $(this).attr("key");

					$.mobile.changePage("#magazine?key=" + key, {
						"transition": "pop"
					});
				
					e.preventDefault();
					e.stopPropagation();
					return false;
				}
            });

            // insight
            $(".track").insight({
                "providers": {
                    "user": function() {
                        return Kiosk.user;
                    }
                }
            }, Kiosk.platform);

        };

        var f = function()
        {
            if (!Kiosk.loaded)
            {
                loadDocuments.call(this, render2);
            }
            else
            {
                render2.call(this);
            }
        };

        if (Kiosk.platform)
        {
            f.call(Kiosk.platform);
        }
        else
        {
            Kiosk.gitanaCallbacks.push(f);
        }
    });

    /*
    $("#list").live("pagebeforeshow", function(evt)
    {
        if (!Kiosk.isUserLoaded())
        {
            Kiosk.redirectToStart();
            evt.preventDefault();
            return false;
        }
    });
    */

    $("#list").live("pagebeforeshow", function(evt)
	{
		$("#tlist").empty();
		$("#search").val("");
		Kiosk.filteredItemIds = null;
	});
	
    $("#list").live("pageshow", function(evt)
    {
        var setup1 = function()
        {
            var me = this;

			Kiosk.mode = "list";

            applyUserState();
			
            // if someone changes the search box, then re-render
            var last = null;
            $('#search').bind('change', function ()
            {
                if (last == $(this).val())
                {
                    return;
                }

                Kiosk.filteredItemIds = null;
                last = $(this).val();
                $.mobile.showPageLoadingMsg();

                // short-cut - if "" specified, just remove filter
                if (last == "")
                {
                    $.mobile.hidePageLoadingMsg();
                    render1.call(me);
                    return;
                }

                Chain(Kiosk.branch).searchNodes(last).then(function() {

                    Kiosk.filteredItemIds = {};
                    this.each(function() {
                        Kiosk.filteredItemIds[this.getId()] = true;
                    });

                }).then(function() {
                    $.mobile.hidePageLoadingMsg();
                    render1.call(me);
                });
            });

            render1.call(this);
        };

        /** NOTE: called with this == gitana platform **/
        var render1 = function()
        {
            $("#tlist").empty();

            // walk all of the items and append them
            for (var i = 0; i < Kiosk.items.length; i++)
            {
                var item = Kiosk.items[i];

                // assume ok if no filtered items specified
                // if filtered items are specified, check to make sure we should proceed with this one
                var ok = true;
                if (Kiosk.filteredItemIds)
                {
                    ok = Kiosk.filteredItemIds[item.key];
                }

                if (ok)
                {
                    var key = item.key;
                    var title = item.title;
					var description = item.description;
                    var insightnode = item.node;
                    var imageUrl = item.mediumImageUrl;

                    $("#tlist").append("<li class='track' insightnode='" + insightnode + "'><a href='#magazine?key=" + key + "'><img width='256px' height='256px' src='" + imageUrl + "'><h3>" + title + "</h3><p>" + description + "</p></a></li>");
                }
            }

            // insight
            $(".track").insight({
                "providers": {
                    "user": function() {
                        return Kiosk.user;
                    }
                }
            }, Kiosk.platform);

            // refresh
            $('#tlist').listview('refresh');
        };

        var f = function()
        {
            if (!Kiosk.loaded)
            {
                loadDocuments.call(this, setup1);
            }
            else
            {
                setup1.call(this);
            }
        };

        if (Kiosk.platform)
        {
            f.call(Kiosk.platform);
        }
        else
        {
            Kiosk.gitanaCallbacks.push(f);
        }
    });

    /*
    $("#magazine").live("pagebeforeshow", function(evt)
    {
        if (!Kiosk.isUserLoaded())
        {
            Kiosk.redirectToStart();
            evt.preventDefault();
            return false;
        }
    });
    */

    $("#magazine").live("pagebeforeshow", function(evt)
	{
		$("#viewport").empty();
	});
	
	$("#magazine").live("pageshow", function(evt)
    {
        var render3 = function()
        {
			$("#viewport").empty();
			$("#viewport").append(' \
					<div id="controllers" style="display:none;"> \
                        <div class="pages shadows" id="magazine-holder"></div> \
                        <div id="next"> <i></i> </div> \
                        <div id="previous"> <i></i> </div> \
                        <div id="shadow-page"></div> \
                    </div> \
			');
			
            var key = getQueryString().key;

            var pages = [];

            var index = Kiosk.findItemIndex(key);
            var item = Kiosk.items[index];

            $("#magazineTitle").html(item.title);

            // add page references
            for (i = 0; i < item.attachments.length; i++)
            {
                pages.push("magazine?key=" + key + "&page=" + (i+1));
            }

            // add css style objects
            for (i = 0; i < item.attachments.length; i++)
            {
                var attachment = item.attachments[i];

                var ruleId = "rule" + (i+1);
                var classId = ".turn-page.p" + (i+1);
                var style = "background-color: #ccc; background-image:url(" + attachment.url +"); background-size: 100% 100%;"

                addRule(ruleId, classId, style);
            }

            $("#magazine-holder").magazine({
                "pages": pages,
                "load": function() {

                    for (var i = 0; i < item.attachments.length; i++)
                    {
                        if (i == 0)
                        {
                            $(this).append("<div class='track' turn-effect='flipboard'><div class='page-content'></div></div>");
                        }
                        else if (i == item.attachments.length - 1)
                        {
                            $(this).append("<div class='track'><div class='page-content last-page'></div></div>");
                        }
                        else
                        {
                            $(this).append("<div class='track'><div class='page-content'></div></div>");
                        }
                    }
                }
            });
        };

        var f = function()
        {
            if (!Kiosk.loaded)
            {
                loadDocuments.call(this, render3);
            }
            else
            {
                render3.call(this);
            }
        };

        if (Kiosk.platform)
        {
            f.call(Kiosk.platform);
        }
        else
        {
            Kiosk.gitanaCallbacks.push(f);
        }
    });


    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // CONNECTIVITY WITH GITANA
    //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////

    $(document).ready(function() {

        // authenticate and load rotator items
        new Gitana().authenticate({
            "username": "app",
            "password": "app"
        }).then(function() {

            // NOTE: this = platform
            Kiosk.platform = this;

            for (var i = 0; i < Kiosk.gitanaCallbacks.length; i++)
            {
                Kiosk.gitanaCallbacks[i].call(Kiosk.platform);
            }
        });

        $(".quitbutton").live("click", function(evt) {

            handleLogout();

            // NOTE: we let the jqm framework pass us to the #splash page
        });
		
		$(".backbutton").live("click", function(evt) {

			var uri = "#" + Kiosk.mode;
			if (getQueryString().key)
			{
				uri += "?key=" + getQueryString().key;
			}

			$.mobile.changePage(uri, {
                "transition": "pop"
            });

			evt.preventDefault();		
			evt.stopPropagation();
			
			return false;
        });
		
        // sets up virtual keyboard for touch devices against all INPUTs
        setupKeyboard(".kbtext", "kiosktext");
        setupKeyboard(".kbzipcode", "kioskzipcode");
    });

    /** call with this == gitana platform **/
    var loadDocuments = function(callback)
    {
        var self = this;

        if (Kiosk.items.length == 0)
        {
            // find the stack that has this app
            var repositoryId = this.getDriver().getStackInfo().datastores["content"].id;
            this.readRepository(repositoryId).readBranch("master").then(function() {

                Kiosk.branch = this;

                this.queryNodes({
                    "_type":"kiosk:asset"
                }, {
					"sort": { "title": 1 }
				}).each(function() {

                    var asset = this;

                    this.listAttachments(true).then(function() {

                        var attachments = [];
                        for (var attachmentId in this.map)
                        {
                            if (this.map.hasOwnProperty(attachmentId))
                            {
                                var attachment = this.map[attachmentId];
                                if (attachmentId.indexOf("preview_") == 0)
                                {
                                    var cdr = attachmentId.substring(8);
                                    if (parseInt(cdr) > -1)
                                    {
                                        attachments.push({
                                            "url": asset.getProxiedUri() + "/attachments/" + attachmentId,
                                            "contentType": attachment.contentType,
                                            "filename": attachment.filename,
                                            "length": attachment.length
                                        });
                                    }
                                }
                            }
                        }

                        var smallImageUrl = null;
                        this.select("preview_small").then(function() {
                            smallImageUrl = this.getDownloadUri();
                        });
                        var mediumImageUrl = null;
                        this.select("preview_medium").then(function() {
                            mediumImageUrl = this.getDownloadUri();
                        });
						var imageUrl = null;
                        this.select("preview").then(function() {
                            imageUrl = this.getDownloadUri();
                        });

                        this.then(function() {

							var description = asset.getDescription();
							if (!description)
							{
								description = "";
							}
							
                            var item = {
                                "key": asset.getId(),
                                "title": asset.getTitle(),
								"description": description,
                                "node": asset.getRepositoryId() + "/" + asset.getBranchId() + "/" + asset.getId(),
                                "imageUrl": imageUrl,
								"mediumImageUrl": mediumImageUrl,
                                "smallImageUrl": smallImageUrl,
                                "attachments": attachments
                            };
                            item["url"] = "#rotator?key=" + item.key;
                            Kiosk.items.push(item);
                        });
                    });

                }).then(function() {

                    Kiosk.loaded = true;

                    // all done
                    if (callback)
                    {
                        callback.call(self);
                    }
                });
            });
        }
        else
        {
            if (callback)
            {
                callback.call(self);
            }
        }
    };

    var setupKeyboard = function(selector, layout)
    {
        // only setup the keyboard for web devices (not ipad, etc)
        var profile = loadDeviceProfile();
        if (profile.web)
        {
			$(selector).keyboard({
				layout: layout,
				keyBinding : 'mousedown touchstart',
				// make sure jQuery UI styles aren't applied even if the stylesheet has loaded
				// the Mobile UI theme will still over-ride the jQuery UI theme
				css : {
					input          : '',
					container      : '',
					buttonDefault  : '',
					buttonHover    : '',
					buttonActive   : '',
					buttonDisabled : ''
				},
				//alwaysOpen: true,
				autoAccept: true,
				//usePreview: true,
				usePreview: false,
				tabNavigation: true

			}).addMobile({
				// keyboard wrapper theme
				container    : { theme:'a' },
				// theme added to all regular buttons
				buttonMarkup : { theme:'a', shadow:'true', corners:'true' },
				// theme added to all buttons when they are being hovered
				buttonHover  : { theme:'a' },
				// theme added to action buttons (e.g. tab, shift, accept, cancel);
				// parameters here will override the settings in the buttonMarkup
				buttonAction : { theme:'a' },
				// theme added to button when it is active (e.g. shift is down)
				// All extra parameters will be ignored
				buttonActive : { theme:'a' }
			});
        }
    };

    var handleLogin = function(successCallback, errorCallback)
    {
        var name = $("#_name").val();
        var email = $("#_email").val();
        var zipcode = $("#_zipcode").val();

        if (!name)
        {
            errorCallback.call(this, "Please provide a 'name'");
            return;
        }
        if (!email)
        {
            errorCallback.call(this, "Please provide an 'email'");
            return;
        }

        Kiosk.user = {};
        Kiosk.user["name"] = name;
        Kiosk.user["email"] = email;
        Kiosk.user["zipcode"] = zipcode;
        Kiosk.saveUserState();

        successCallback.call(this);
    };

    var handleLogout = function()
    {
        Kiosk.resetUserState();
        Kiosk.user = {};
        $("#_name").val("");
        $("#_email").val("");
        $("#_zipcode").val("");
    };

    var applyUserState = function()
    {
        var title = "Welcome";
        if (Kiosk.user && Kiosk.user.name)
        {
            title += " " + Kiosk.user.name;
        }
        title += ", please chooose:"

        $(".selectorTitle").html(title);
    };

    /*** sniff the UA of the client and show hidden div's for that device ***/
    var loadDeviceProfile = function()
    {
        var ua = navigator.userAgent;
        var checker = {
            iphone: ua.match(/(iPhone|iPod|iPad)/),
            blackberry: ua.match(/BlackBerry/),
            android: ua.match(/Android/)
        };
        if (checker.iphone || checker.blackberry || checker.android)
        {
            checker.mobile = true;
        }
        else
        {
            checker.web = true;
        }

        /*
        if (checker.android){
            $('.android-only').show();
        }
        else if (checker.iphone){
            $('.idevice-only').show();
        }
        else if (checker.blackberry){
            $('.berry-only').show();
        }
        else {
            $('.unknown-device').show();
        }
        */
        return checker;
    };

    var addRule = function(id, selector, value)
    {
        $("#" + id).remove();

        var style = $("<style id='" + id + "'>" + selector + " { " + value + " }</style>");
        $("html > head").append(style);
    };

    var Kiosk = {};
    Kiosk.items = [];
    Kiosk.platform = null;
    Kiosk.gitanaCallbacks = [];
    Kiosk.user = {};
    Kiosk.loaded = false;
    Kiosk.filteredItems = {};
    Kiosk.mode = "rotator";

    Kiosk.loadUserState = function()
    {
        if (typeof sessionStorage !='undefined')
        {
            if (sessionStorage.kioskUser)
            {
                Kiosk.user = JSON.parse(sessionStorage.kioskUser);
            }
        }
    };

    Kiosk.saveUserState = function()
    {
        if (typeof sessionStorage !='undefined')
        {
            sessionStorage.kioskUser = JSON.stringify(Kiosk.user);
        }
    };

    Kiosk.resetUserState = function()
    {
        if (typeof sessionStorage !='undefined')
        {
            delete sessionStorage.kioskUser;
        }
    };

    Kiosk.findItemIndex = function(key)
    {
        var index = null;

        for (var x = 0; x < Kiosk.items.length; x++)
        {
            if (Kiosk.items[x].key == key)
            {
                index = x;
                break;
            }
        }

        return index;
    };

    Kiosk.isUserLoaded = function()
    {
        return (Kiosk.user && Kiosk.user.name);
    };

    Kiosk.redirectToStart = function()
    {
        var href = window.location.href;
        if (href.indexOf("#") > -1)
        {
            href = href.substring(0, href.indexOf("#"));
        }

        window.location.href = href;
    };

    window.Kiosk = Kiosk;

    // load any user state
    Kiosk.loadUserState();

})($, window);


// extend the keyboard so that pressing ENTER accepts without submitting the form
$.extend($.keyboard.keyaction, {
    enter : function(kb) {
        // accept the content and close the keyboard
        kb.accept();
        kb.$el.trigger("change");
        return false;
        // submit the form
        //kb.$el.closest('form').submit();
    }
});
