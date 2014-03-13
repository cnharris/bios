
/**
 * Module dependencies.
 */

var express = require('express');
var logger = require("logger");
var http = require('http');
var path = require('path');
var redis = require("redis");
var redis_client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);
var app = express();

// all environments
app.set('port', process.argv[2] || process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/twitter/*', function(req, res){
		redis_client.get('twitter-davidferrer87', function(err, reply){
		  if(err){
			  res.send(err);
			} else {
				res.send(reply);
			}
		});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
