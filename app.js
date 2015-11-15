var express = require('express');


var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');



var mongoose = require('mongoose');
var passport = require('passport');

mongoose.connect('mongodb://localhost/news');

// add the schemas to  mongoose
require('./models/user');
require('./models/jwtSecret');
require('./models/resource');
require('./models/permission');


var index = require('./routes/index');
var user = require('./routes/user');

// prepare secret for jwt

var JWTSecret = mongoose.model("broadsword_jwtSecret");

JWTSecret.findOne({}, function(err, doc){
    if (err) {
        throw new Error("cannot find secret");

    }else if (doc){
        // load the secret from the database

        user.update_secret();
    }else{

        var newsecret = new JWTSecret({});
        newsecret.change();

        newsecret.save(function(err){
            // load the secret from the database
            if (err) {
                throw new Error("cannot add new secret");
            }

            user.update_secret();
        });

    }
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


app.use('/', index);


app.use('/user', user);


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
