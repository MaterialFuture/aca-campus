var express = require('express');
var app = express();

if (process.env.NODE_ENV === 'production') {
  app.use(function (req, res, next) {
    var schema = (req.headers['x-forwarded-proto'] || '').toLowerCase();
    if (schema === 'https') {
      next();
    } else {
      res.redirect('https://' + req.headers.host + req.url);
    }
  });
} else if (process.env.NODE_ENV === 'test') {
  process.env.MONGOLAB_URI = process.env.TEST_DB;
} else {
  require('dotenv').config();
}

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var flash = require('express-flash');
var cookieParser = require('cookie-parser')
var csrf = require('csurf')

var routes = require('./routes/index');
var reset = require('./routes/reset');
var users = require('./routes/users');
var terms = require('./routes/terms');
var courses = require('./routes/courses');
var charges = require('./routes/charges');
var locations = require('./routes/locations');

var passport = require('./config/passport');

var methodOverride = require('method-override')

var middleware = require('./routes/middleware');

app.use(methodOverride('_method'));

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOLAB_URI);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_KEY,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(csrf({cookie: true}));

app.use('/', routes);
app.use('/reset', reset);
app.use('/api/users', middleware.auth, users);
app.use('/api/terms', middleware.auth, terms);
app.use('/api/courses', middleware.auth,  courses);
app.use('/api/charges', middleware.auth, charges);
app.use('/api/locations', middleware.admin, locations);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
