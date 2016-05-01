// need some more middle ware from express
var express = require('express');
var path = require('path');
var compress = require('compression');
var pack = require('./middleware/pack');
var webpackConfig = require('./webpack.config.js');
var crypto = require('crypto');
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

  // simulate server response delay (ms)
  if (config.artificialDelay) {
    server.express.use(function(req, res, next){
      setTimeout(function(){
        next();
      }, config.artificialDelay);
    });
  }

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
  server.express.get('/', function(req, res, next) {
    // TODO: set this from database value
    res.render('index', { title: server.config.name });
  });

  // api routs

  var apimodelfactory = require('./apifactory');

  // add custom models to server
  if (config.modelPaths) {
    config.modelPaths.forEach(function(modelPath){
      apimodelfactory.addModels(require(modelPath));
    });
  }

  apimodelfactory.serveModels(server);

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

  //
  apimodelfactory.api.admin.collection.findOne().exec()
  .then(function(admin){
    if (!admin) {
      // no admin object exists, create a user and then create admin object with user
      // making it the default admin user.
      var tmpPassword;

      apimodelfactory.api.user.create()
      .then(function(user){
        user.signin = {
          username: 'admin'
        };

        tmpPassword = crypto.randomBytes(16).toString('hex');
        return user.setPassword(tmpPassword);
      })
      .then(function(user){
        return apimodelfactory.api.admin.create({}, user);
      })
      .then(function(admin){
        admin.settings = {};

        for(var model in apimodelfactory.api) {
          if (apimodelfactory.api[model].settings) {
            admin.settings[model] = {};
            for(var setting in apimodelfactory.api[model].settings) {
              admin.settings[model][setting] = apimodelfactory.api[model].settings[setting];
            }
          }
        }

        admin.markModified('settings');

        return admin.save();
      })
      .then(function(admin){
        console.log("A new admin user has been created, with a random temporary password.");
        console.log("This is the only time this message will be generated.");
        console.log("Username: admin");
        console.log("Password: " + tmpPassword);
        console.log("Please log into the admin user to set a new password, and to configure the settings.");
      });
    }else{
      // there is already an admin object. Just make sure the settings field is up-to-date

      for(var model in apimodelfactory.api) {
        if (apimodelfactory.api[model].settings) {
          if (!admin.settings[model]) {
            admin.settings[model] = {};
          }

          for(var setting in apimodelfactory.api[model].settings) {
            if (!admin.settings[model][setting]) {
              admin.settings[model][setting] = apimodelfactory.api[model].settings[setting];
            }
          }
        }
      }

      admin.markModified('settings');

      admin.save();
    }
  });
};
