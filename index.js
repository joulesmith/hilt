// need some more middle ware from express
var express = require('express');
var path = require('path');
var compress = require('compression');
var pack = require('./middleware/pack');
var webpackConfig = require('./webpack.config.js');
// load initialized server instance
//
module.exports = function(config) {
  var server = require('./server');
  server.configure(config);

  // load schemas to mongoose
  require('./models/settings');

  // view engine setup
  server.express.set('views', path.join(__dirname, 'views'));
  server.express.set('view engine', 'ejs');

  // add express middleware for serving files
  server.express.use(compress());
  server.express.use(express.static(path.join(__dirname, 'dist')));
  server.express.use(express.static(path.join(__dirname, 'public')));

  if (config.appPath) {
    webpackConfig.entry = config.appPath;
  }

  // serve bundled front-end files
  server.express.use(pack(webpackConfig));

  // third party middleware
  if (config.favicon) {
    var favicon = require('serve-favicon');
    server.express.use(favicon(path.join(__dirname, config.favicon)));
  }

  if (config.log){
    var logger = require('morgan');
    server.express.use(logger(config.log));
  }


  // view routs
  server.express.use('/', function(req, res, next) {
    // TODO: set this from database value
    res.render('index', { title: server.config.name });
  });

  // api routs
  //
  // TODO: convert these to the combined api/model format

  var apimodelfactory = require('./apifactory')(server);

  // add custom models to server
  if (config.modelPaths) {
    config.modelPaths.forEach(function(modelPath){
      apimodelfactory.addModels(require(modelPath));
    });
  }

  apimodelfactory.serveModels();

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
        status: err.status || 500,
        message: err.message,
        stack: err.stack,
        code: err.code || 'internalerror'
      }
    });
  });
};
