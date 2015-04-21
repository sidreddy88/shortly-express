var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var timeout = require('connect-timeout');
var signedIn = false;
var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());

app.use(timeout(120000));

// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(express.session());

function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}



app.get('/', 
function(req, res) {
  if (!signedIn) {
    res.redirect('/login');
  } else {
  res.render('index');
 }
});

app.get('/create', 
function(req, res) {
  res.render('index');
});

app.get('/links', 
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
 app.post('/login', function(req,res){

   var username = req.body.username;
   var password = req.body.password;

   db.knex('users').where('username',username)
              .then(function(rows){
                console.log( "Username:" + rows[0]['username']);
                console.log("Password:" + rows[0]['password']);

                var userPassword = rows[0]["password"];
                if (userPassword === password) {
                  signedIn = true;
                  res.redirect('/');
                } else {
                  res.redirect('/login');
                }
                });

   // console.log("INSIDE POST REQUEST");
   // console.log(req.body);
   // res.send(201, "Hello");
   //res.render('login');

 });

 app.post('/signup', function(req,res){

   var username = req.body.username;
   var password = req.body.password;

   new User({
          'username': username,
          'password': password
    }).save().then(function(user){
      console.log("This is the user:" + user);
      //done();
    });

    db.knex('users')
          .where('username', username)
          .then(function(rows) {
            console.log("Login Post Res UserName: " + rows[0]['username']);
            console.log("Login Post Res Password: " + rows[0]['password']);
            //done();
            });
   res.redirect('/login');
   //res.render('login');

 });


 app.get('/login', function(req,res){
   res.render('login');

 });
 app.get('/signup', function(req,res){
   res.render('signup');

 });


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  console.log("INSIDE APP ALL");
  console.log("REQUEST PARAMETRES :" + req.params[0]);
  console.log("I AM NOT SUPPOSED TO BE HERE");
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    console.log("CURRENT LINK:" + link);
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
