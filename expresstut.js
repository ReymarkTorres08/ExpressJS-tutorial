// Import the express module on node_modules
var express = require('express');
// Use the express
var app = express();

// Block our header from containing information about our server
app.disable('x-powered-by');

var handlebars = require('express-handlebars').create({defaultLayout:'main'});

/* Handlebars templating */
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// MORE IMPORTS HERE
// Allow to parse encoded data middleware
app.use(require('body-parser').urlencoded({extended: true}));
// Allow the user to upload files middleware
var formidable = require('formidable');
// Cookie middleware
var credentials = require('./credentials.js');
app.use(require('cookie-parser')(credentials.cookieSecret));

app.set('port', process.env.PORT || 3002);

// Set the static directory to public/
app.use(express.static(__dirname + '/public'));

app.get('/',function(req, res) {
		res.render('home');
});

// Middlewares
app.use(function(req, res, next) {
		console.log("Looking for URL : " + req.url);
		next();
});

app.get('/junk', function(req, res, next) {
	console.log('Tried to access /junk');
	// Throw an error
	throw new Error('/junk doesn\'t exist');
});

// Catch the error so that it would not be fatal to be rendered in the 
app.use(function(err, req, res, next) {
		console.log('Error: ' + err.message);
		next();
});

app.get('/about',function(req, res) {
		res.render('about');
});

app.get('/contact', function(req, res) {
	// Render a CSRF token
	res.render('contact', {csrf: 'CSRF token here'});
});

app.get('/thankyou', function(req, res) {
	res.render('thankyou');
});

app.get('/file-upload', function(req, res) {
	var now = new Date();
	res.render('file-upload', {
		year: now.getFullYear(),
		month: now.getMonth()
	});
});

app.post('/file-upload/:year/:month', function(req, res) {
	var form = new formidable.IncomingForm(); // get the incoming form
	form.parse(req, function(err, fields, file) {
		if (err) {
			return res.redirect(303, '/error');
		}

		console.log('Received File');
		console.log(file);
		res.redirect(303, '/thankyou');
	});
});

// Set the cookie
app.get('/cookie', function(req, res) {
	res.cookie('username', 'Reymark Torres', {expire: new Date() + 9999}).send('usename has the value of Reymark Torres');
});
// List all cookies
app.get('/listcookies', function(req, res) {
	console.log("Cookies : ", req.cookies);
	res.send('Look in the console for cookies');
});
// Delete the 'usename' cookie
app.get('/deletecookie', function(req, res) {
	res.clearCookie('username');
	res.send('usename Cookie Deleted');
});

app.post('/process', function(req, res) {
	console.log('Form :" ' + req.query.form);
	console.log('CSRF token : ' + req.body._csrf);
	console.log('Email : ' + req.body.email);
	console.log('Question : ' + req.body.ques);

	res.redirect(303, '/thankyou');
});

// Set a session middleware
var session = require('express-session');
// Set a parse-url middleware
// This provides the URL of the request object that is passed to us
var parseurl = require('parseurl');

app.use(session({
	resave: false, // resave only to the session store if a changes has been made
	saveUninitialized: true, // store session information if it is new
	secret: credentials.cookieSecret, // use the credentials.js secret
}));

// Middleware
// Tracks how many time the users is go to a specific page
app.use(function(req, res, next) {
	var views = req.session.views;

	if (!views) {
		views = req.session.views = {};
	}

	var pathname = parseurl(req).pathname; // get the pathname using parseurl
	views[pathname] = (views[pathname] || 0) + 1;

	next();
});

app.get('/viewcount', function(req, res, next) {
	res.send('You view this page ' + req.session.views['/viewcount'] + ' times');
});

// File system dependency
var fs = require("fs");

app.get('/readfile', function(req, res, next) {
	fs.readFile('./public/randomfile.txt', function(err, data) {
		if (err) {
			return console.error(err);
		}

		res.send("The File : " + data.toString());
	});
});

app.get('/writefile', function(req, res, next) {
	fs.writeFile('./public/randomfile2.txt', 'More random text hahaha yow', function(err) {
		if (err) {
			return console.error(err);
		}
	});

	fs.readFile('public/randomfile2.txt', function(err, data) {
		if (err) {
			return console.error(err);
		}

		res.send("The File " + data.toString());
	});
});




// For 404 URL error
app.use(function(req, res, next) {
	res.type('text/html'); // type
	res.status(404); // status
	res.render('404'); // HTML form
});

// For 500 URL error
app.use(function(err, req, res, next) {
	console.log(err.stack);
	res.status(500); // status
	res.render('500'); // HTML form
});


app.listen(app.get('port'), function() {
		console.log("Express started on http://localhost:" + app.get('port') + ' Press Ctrl-C to terminate');
});


