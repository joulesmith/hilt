var express = require('express');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var path = require('path');

// connect to database
// TODO have this set from a configuration file
mongoose.connect('mongodb://localhost/broadsword');

// load schemas to mongoose
require('./models/administrator');
require('./models/user');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// third party middleware
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// view routs
app.use('/', require('./routes/index'));

// api routs
app.use('/api/util', require('./routes/api/util'));
app.use('/api/users', require('./routes/api/users'));
//app.use('/api/profiles', require('./routes/api/profiles'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {

    var err = new Error('Resource not found.');
    err.status = 404;
    next(err);
});

// error handlers

app.use(function(err, req, res, next) {

  res.status(err.status || 500).json({
    error: {
        message : err.message,
        stack : err.stack
    }
  });
});

module.exports = app;
