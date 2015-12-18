var mongoose = require('mongoose');
var User = mongoose.model("user");


var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({
            username : username
        })
        .exec()
        .then(function(user){
            if (!user) {
                done(null, false, { message: 'Incorrect username.' });
                return null;
            }

            return user.verifyPassword(password);
        })
        .then(function(user){

            if (!user) {
                done(null, false, { message: 'Incorrect password.' });
                return null;
            }

            return done(null, user);
        })
        .catch(function(error){
            done(err);
        });
    }
));

module.exports = function() {
    return function(req, res, next) {

        try {

            if (req.body.username && req.body.password){
                User.findOne({
                    username : '' + req.body.username
                })
                .exec()
                .then(function(user){
                    if (!user) {
                        return null;
                    }

                    return user.verifyPassword('' + req.body.password);
                })
                .then(function(user){

                    if (user) {
                        req.user = user;
                    }

                    next();
                })
                .catch(function(error){
                    next(error);
                });

            }else if (req.headers && req.headers.authorization && req.headers.authorization !== '') {



                var token = JSON.parse(new Buffer(req.headers.authorization, 'base64').toString('utf8'));

                if (token._id && token.secret){
                    User.findById(token._id).exec()
                    .then(function(user){
                        if (!user) {
                            next();
                            return null;
                        }

                        return user.verifyToken(token);
                    })
                    .then(function(user){
                        if (user) {
                            req.user = user;
                        }

                        next();
                    })
                    .catch(function(error){
                        next(error);
                    });
                }else{
                    next();
                }
            }else{
                next();
            }
        }catch(error){
            next(error);
        }
    };
};
