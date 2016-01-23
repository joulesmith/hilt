// need some more middle ware from express
var express = require('express');
var path = require('path');
var compress = require('compression');

// load initialized server instance
var server = require('./server');


// load schemas to mongoose
require('./models/settings');
require('./models/user');
require('./models/profile');



// view engine setup
server.express.set('views', path.join(__dirname, 'views'));
server.express.set('view engine', 'ejs');

// add express middleware for serving files
server.express.use(compress());
server.express.use(express.static(path.join(__dirname, 'dist')));
server.express.use(express.static(path.join(__dirname, 'public')));



// third party middleware
if (server.config.favicon) {
    var favicon = require('serve-favicon');
    server.express.use(favicon(path.join(__dirname, server.config.favicon)));
}

if (server.config.log){
    var logger = require('morgan');
    server.express.use(logger(server.config.log));
}


// view routs
server.express.use('/', require('./routes/index')(server));

// api routs
//
// TODO: convert these to the combined api/model format
server.express.use('/api/util', require('./routes/api/util'));
server.express.use('/api/user', require('./routes/api/user'));

var apimodelfactory = require('./models/apifactory')(server);

// needed for group permissions
apimodelfactory.addModels(require('./models/group'));

// needed for contacting users by email, phone, and postal
apimodelfactory.addModels(require('./models/email'));

// needed for uploading files to the server
apimodelfactory.addModels(require('./models/file'));

// needed for tracking payments to users
apimodelfactory.addModels(require('./models/account'));

//
apimodelfactory.addModels(require('./models/product'));

//
apimodelfactory.addModels(require('./models/service'));

//
apimodelfactory.addModels(require('./models/order'));

//
apimodelfactory.addModels(require('./models/receipt'));

// A free-form page which text, images, etc can be added
apimodelfactory.addModels(require('./models/profile'));

// catch 404 and forward to error handler
server.express.use(function(req, res, next) {

    var err = new Error('Resource not found.');
    err.status = 404;
    next(err);
});

// error handlers

server.express.use(function(err, req, res, next) {
console.log(err);
  res.status(err.status || 500).json({
    error: {
        status : err.status || 500,
        message : err.message,
        stack : err.stack,
        code : err.code || 'internalerror'
    }
  });
});
