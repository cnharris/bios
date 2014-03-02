// Load the http module to create an http server.
var http = require('http');
var OAuth = require('oauth').OAuth;
var Memcached = require('memcached');
var winston = require('winston');

//General
var args = process.argv;
if(args.length < 3){ 
  process.exit(1); 
}
var query = args.pop();
var retries = 3;

//Logger
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({ filename: 'logs/twitter/'+query+'.log' })
  ]
});

//Memcached
var pool_size = 25;
var server_location = "localhost:11211";
var options = { "retries": 5, "retry":10000 };
var one_day = 86400;

Memcached.config.poolSize = pool_size;
var memcached = new Memcached(server_location, options);

//OAuth
var access_token = '631605123-CN1B04oSRuvNUKkSr5ezrYFqIHgWr3e9A4lC2gyn';
var access_token_secret = 'WqCGUDswB4LkTSwuSoe371qch46vx8McFPZUHc6EyMEKd';
var count = 50;
var oa = new OAuth("https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  "dCbPbDSfuJlzrtHl7RHyxA",
  "Ijue0TNze3EYAgkz9DGnLDcDUriYF4XdYMEpW2q0wU",
  "1.0A",
  null,
  "HMAC-SHA1");

var fetchTweets = function(query, number){
  logger.info("Fetching Twitter user timeline for "+query);
  oa.get("https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name="+query+"&count="+count,access_token,access_token_secret, 
    function (error, data) {
      if(error){
        logger.warn("Fetching Twitter user timeline for "+query+" failed. Error: "+error+", retry: "+number);
        if(number < retries){
          fetchTweets(query, number+1);
        } else {
          logger.error("Could not fetch Twitter user timeline for query: "+query);
          process.exit(0);
        }
      } else {
        memcached.set(query,data,one_day,function(err){
          if(err){
            logger.warn("Memcached set error for query: "+query+", retry: "+number);
            if(number < retries){
              fetchTweets(query, number+1);
            } else {
              logger.error("Could not set memcached key for query: "+query);
              process.exit(1);
            }
          } else {
            logger.info("Memcached key: twitter-"+query+" set successfully, exiting process");
            process.exit(0);
          }
        });
      }
  });
};

(function(){ fetchTweets(query, 0); })();
