
var express = require('express'),
	app = express();

// Port config if the app is run on heroku:

var port = process.env.PORT || 3000;

// Create a express server
var server = app.listen(port,function(){
	console.log('Your application is running on http://localhost:' + port);
});

// Create a new socket and listen to express port
var io = require('socket.io').listen(server);

//--------------------------------
//Configuration
//--------------------------------

// Set .html as the default template extension
app.set('view engine', 'html');

// Initialize the ejs template engine
app.engine('html', require('ejs').renderFile);

// Tell express where it can find the templates
app.set('views', __dirname + '/views');

// Make the files in the public folder available to the world
app.use(express.static(__dirname + '/public'));


//Require the  routes files, and pass
//the app and io as arguments to the returned functions.
require('./routes')(app, io);

