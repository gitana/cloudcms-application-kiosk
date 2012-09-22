var express = require('express');
//var routes = require('./routes');
var http = require('http');
var path = require('path');
var Properties = require('properties');
var app = express();

app.configure(function(){
//  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  //app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  //app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
  app.set('port', process.env.PORT || 3000)
});

var startServer = function()
{
	// create web server
	http.createServer(app).listen(app.get('port'), function(){
	    console.log("Express server listening on port " + app.get('port'));
	});	
};

// load the hosted config
new Properties().load('hosted.properties', function(error) {
	
	var props = this;

	if (props.port)
	{
		app.set('port', props.port);
	}

	startServer();
		
});
