var mongoose = require('mongoose');

module.exports = function() {
  return function(req, res, next) {

    try {
      var User = mongoose.model("user");

      if (req.headers && req.headers.authorization && req.headers.authorization !== '') {

        var token = JSON.parse(new Buffer(req.headers.authorization, 'base64').toString('utf8'));

        if (token._id && token.secret) {
          User.findById(token._id).exec()
            .then(function(user) {
              if (!user) {
                next();
                return null;
              }

              return user.verifyToken(token);
            })
            .then(function(user) {
              if (user) {
                req.user = user;
              }

              next();
            })
            .catch(function(error) {
              next(error);
            });
        } else {
          next();
        }
      } else if (req.body.username && req.body.password) {
        User.findOne({
          "signin.username": '' + req.body.username
        })
        .exec()
        .then(function(user) {
          if (!user) {
            return null;
          }

          return user.verifyPassword('' + req.body.password);
        })
        .then(function(user) {

          if (user) {
            req.user = user;
          }

          next();
        })
        .catch(function(error) {
          next(error);
        });

      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  };
};
