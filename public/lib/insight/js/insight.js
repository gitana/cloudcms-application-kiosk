/*
Copyright 2011 Gitana Software, Inc.

Licensed under the Apache License, Version 2.0 (the "License"); 
you may not use this file except in compliance with the License. 

You may obtain a copy of the License at 
	http://www.apache.org/licenses/LICENSE-2.0 

Unless required by applicable law or agreed to in writing, software 
distributed under the License is distributed on an "AS IS" BASIS, 
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
See the License for the specific language governing permissions and 
limitations under the License. 

For more information, please contact Gitana Software, Inc. at this
address:

  info@gitanasoftware.com
*/
(function(window, $)
{
    Insight = function(el, config, gitanaObject)
    {
        // el can either be a dom id or a dom element
        if (el)
        {
            if (Insight.isString(el)) {
                el = $("#" + el);
            }
        }

        if (!config)
        {
            config = {};
        }

        // if a gitana object is passed in, then...
        //   if it is a Gitana Platform, assume the "primary" warehouse
        //   if it is a Gitana Warehouse, then use it
        var warehouseId = null;
        if (gitanaObject)
        {
            if (gitanaObject.objectType)
            {
                if (gitanaObject.objectType == "Gitana.Platform")
                {
                    warehouseId = "primary";
                }
                else if (gitanaObject.objectType == "Gitana.Warehouse")
                {
                    warehouseId = gitanaObject.getId();
                }
            }

            if (warehouseId)
            {
                Insight.APPLICATION_KEY = gitanaObject.getDriver().getApplicationInfo().id;

                config["url"] = "/proxy/warehouses/" + warehouseId + "/interactions/_create";
                if (!config["providers"])
                {
                    config["providers"] = {};
                }
                config["providers"]["node"] = function(event) {
                    var currentTarget = event.currentTarget;

                    var repoId = null;
                    var branchId = null;
                    var nodeId = null;

                    var attr = $(currentTarget).attr("insightnode");
                    if (attr)
                    {
                        // structure is <repoId>/<branchId>/<nodeId>
                        var i = attr.indexOf("/");
                        if (i > -1)
                        {
                            repoId = attr.substring(0, i);
                            var j = attr.indexOf("/", i+1);
                            if (j > -1)
                            {
                                branchId = attr.substring(i+1, j);
                                nodeId = attr.substring(j+1);
                            }
                        }
                    }

                    return {
                        "repositoryId": repoId,
                        "branchId": branchId,
                        "id": nodeId
                    };
                }
            }
        }

        // if events array not specified, assume all events
        if (!config.events)
        {
            //config.events = ["click", "mouseover"];
            config.events = ["click"];
        }

        // construct a map of provider functions
        // this can be overridden with config
        var PROVIDER_DEFAULTS = {
            "user": function(event) {
                return {};
            },
            "source": function(event) {
                return {
                    "user-agent": navigator.userAgent,
                    "platform": navigator.platform
                };
            },
            "page": function(event) {
                return {
                    "uri": window.location.pathname,
                    "hash": window.location.hash,
                    "fullUri": window.location.pathname + window.location.hash
                };
            },
            "application": function(event) {
                return {
                    "host": window.location.host,
                    "hostname": window.location.hostname,
                    "port": window.location.port,
                    "protocol": window.location.protocol,
                    "url": window.location.protocol + "//" + window.location.host
                };
            },
            "node": function(event) {
                return {
                    "repositoryId": "",
                    "branchId": "",
                    "id": ""
                };
            }
        };

        var providers = {};
        Insight.copyInto(providers, PROVIDER_DEFAULTS, true);
        if (config.providers)
        {
            Insight.copyInto(providers, config.providers, true);
        }

        // each item that we're tracking receives a unique IID based on its xpath location
        // it also receives the "insight-tracking" class
        // only do this once for each element
        Insight.iidCounter = 0;
        $(el).each(function() {
            if (!$(this).hasClass("insight-tracking"))
            {
                var iid = Insight.createInsightId(this);
                $(this).addClass("iid-" + iid);
				
				console.log("Appended IID: " + iid);
            }
        });

        // bind event handlers
        for (var i = 0; i < config.events.length; i++)
        {
            var eventType = config.events[i];

            $(el).each(function() {

                if (!$(this).hasClass("insight-tracking"))
                {
                    $(this).bind(eventType, function(event)
                    {
                        Insight.captureEvent(event, providers);
                    });

                    $(this).addClass("insight-tracking");
                }
            });
        }

        // start a background thread that updates the server with any events we captured
        var syncFunction = config.sync;
        if (!syncFunction)
        {
            if (config.url)
            {
                syncFunction = function(items, successCallback, failureCallback)
                {
                    var obj = {
                        "rows": items
                    };

                    // use jquery ajax method
                    $.ajax({
                        "type": "POST",
                        "url": config.url,
                        "contentType": "application/json",
                        "data": "" + JSON.stringify(obj),
                        "dataType": "json",
                        "processData": false,
                        "success": function(success) {
                            if (successCallback)
                            {
                                successCallback();
                            }
                        },
                        "error": function(err)
                        {
                            if (failureCallback)
                            {
                                failureCallback(err);
                            }
                        }
                    });
                };
            }
        }
        if (!syncFunction)
        {
            // default (logs to console, nothing more)
            syncFunction = function(items, successCallback, failureCallback)
            {
                Insight.loggingSyncFunction(items, successCallback, failureCallback);
            };
        }
        if (!Insight.syncThreadStarted)
        {
            Insight.syncQueue(syncFunction);
            Insight.syncThreadStarted = true;
        }
    };

    // active application
    Insight.APPLICATION_KEY = null;
    // active session
    Insight.SESSION_KEY = null;
    // active user
    Insight.USER_KEY = null;
    Insight.QUEUE = [];
    Insight.VERSION = "0.1.0";
    Insight.syncThreadStarted = false;
    Insight.iidCounter = 0;
    Insight.makeArray = function(nonArray) {
        return Array.prototype.slice.call(nonArray);
    };

    Insight.isFunction = function(obj) {
        return Object.prototype.toString.call(obj) === "[object Function]";
    };
    Insight.isString = function(obj) {
        return (typeof obj == "string");
    };
    Insight.copyInto = function(target, source, includeFunctions) {
        for (var i in source)
        {
            if (source.hasOwnProperty(i))
            {
                if (Insight.isFunction(source[i]))
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

    Insight.captureEvent = function(event, providers) {

        var now = new Date().getTime();

        if (!Insight.SESSION_KEY)
        {
            Insight.SESSION_KEY = "SESSION_KEY_" + now;
            //console.log("SESSION KEY: " + Insight.SESSION_KEY);

            Insight.USER_KEY = "USER_KEY_" + now;
            //console.log("USER KEY: " + Insight.USER_KEY);

            // no session yet, so delineate that we started one
            Insight.QUEUE.push({
                "event": {
                    "type": "start_session"
                },
                "timestamp": {
                    "ms": now
                },
                "appKey": Insight.APPLICATION_KEY,
                "sessionKey": Insight.SESSION_KEY,
                "userKey": Insight.USER_KEY,
                "page": providers["page"](event),
                "application": providers["application"](event),
                "user": providers["user"](event),
                "source": providers["source"]
            });
        }

        // push the event
        var iid = Insight.lookupIID(event.currentTarget);
        Insight.QUEUE.push({
            "event": {
                "type": event.type,
                "x": event.pageX,
                "y": event.pageY,
                "offsetX": event.offsetX,
                "offsetY": event.offsetY
            },
            "timestamp": {
                "ms": now
            },
            "element": {
                "id": event.currentTarget.id,
                "type": event.currentTarget.nodeName,
                "iid": iid
            },
            "appKey": Insight.APPLICATION_KEY,
            "sessionKey": Insight.SESSION_KEY,
            "userKey": Insight.USER_KEY,
            "page": providers["page"](event),
            "application": providers["application"](event),
            "user": providers["user"](event),
            "source": providers["source"](event),
            "node": providers["node"](event)
        });
    };
    Insight.endSession = function(providers)
    {
        var now = new Date().getTime();

        if (Insight.SESSION_KEY)
        {
            // delinate that we ended the session
            Insight.QUEUE.push({
                "event": {
                    "type": "end_session"
                },
                "timestamp": {
                    "ms": now
                },
                "appKey": Insight.APPLICATION_KEY,
                "sessionKey": Insight.SESSION_KEY,
                "userKey": Insight.USER_KEY,
                "page": providers["page"](event),
                "application": providers["application"](event),
                "user": providers["user"](event),
                "source": providers["source"](event)
            });

            Insight.SESSION_KEY = null;
        }
    };
    Insight.syncQueue = function(syncFunction)
    {
        var self = this;
        var blocking = false;

        var f = function()
        {
            if (!blocking)
            {
                var queueCount = Insight.QUEUE.length;
                if (queueCount > 0)
                {
                    console.log("Sync queue started at: " + new Date().getTime());

                    var items = Insight.QUEUE.slice(0, queueCount);
                    console.log(" -> sending " + items.length + " items to server");

                    blocking = true;
                    syncFunction.call(self, items, function(success) {
                        Insight.QUEUE = Insight.QUEUE.slice(queueCount);
                        blocking = false;
                    }, function(failure) {
                        // assume none of the items successfully made it through
                        // try again on the next pass
                        blocking = false;
                    });
                }
                else
                {
                    console.log("Sync queue pass, nothing to do");
                }
            }
            else
            {
                console.log("Operation currently in process, blocking");
            }

            window.setTimeout(function() {
                f.call(self);
            }, 5000);
        };

        f.call(self);
    };
    Insight.loggingSyncFunction = function(items, successCallback, failureCallback)
    {
        if (items && items.length > 0)
        {
            for (var i = 0; i < items.length; i++)
            {
                var item = items[i];
                console.log(" -> SEND: " + JSON.stringify(item));
            }

            if (successCallback)
            {
                successCallback();
            }
        }

        return true;
    };
    Insight.createXPathFromElement = function(elm) {
        var allNodes = document.getElementsByTagName('*');
        for (segs = []; elm && elm.nodeType == 1; elm = elm.parentNode)
        {
            if (elm.hasAttribute('id')) {
                var uniqueIdCount = 0;
                for (var n=0;n < allNodes.length;n++) {
                    if (allNodes[n].hasAttribute('id') && allNodes[n].id == elm.id) uniqueIdCount++;
                    if (uniqueIdCount > 1) break;
                }
                if ( uniqueIdCount == 1) {
                    segs.unshift('id("' + elm.getAttribute('id') + '")');
                    return segs.join('/');
                } else {
                    segs.unshift(elm.localName.toLowerCase() + '[@id="' + elm.getAttribute('id') + '"]');
                }
            } else if (elm.hasAttribute('class')) {
                segs.unshift(elm.localName.toLowerCase() + '[@class="' + elm.getAttribute('class') + '"]');
            } else {
                for (i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) {
                    if (sib.localName == elm.localName)  i++; };
                segs.unshift(elm.localName.toLowerCase() + '[' + i + ']');
            }
        }
        return segs.length ? '/' + segs.join('/') : null;
    };
    Insight.createInsightId = function(elm) {
        var str = window.location.protocol + window.location.hostname + ":" + window.location.port + window.location.pathname;
        var iid = Insight.hashcode(str) + "_" + Insight.iidCounter;
        Insight.iidCounter++;

        return iid;
    };
    Insight.hashcode = function(str) {
        var hash = 0;
        if (str.length == 0) return hash;
        for (i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash; // Convert to 32bit integer
        }
        if (hash < 0) {
            hash = hash * -1;
        }
        return hash;
    };
    Insight.lookupIID = function(el)
    {
        var iid = null;

        if ($(el).attr("class"))
        {
            var classList =$(el).attr('class').split(/\s+/);
            $.each( classList, function(index, item){
                if (item.indexOf("iid-") == 0)
                {
                    iid = item.substring(4);
                }
            });
        }

        return iid;
    };

    $.insight = Insight;

    $.fn.insight = function()
    {
        var args = Insight.makeArray(arguments);

        // append this into the front of args
        var newArgs = [].concat(this, args);

        // invoke, hand back field instance
        return Insight.apply(this, newArgs);
    };

})(window, jQuery);