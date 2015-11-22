var mongoose = require('mongoose');

var User = mongoose.model("user");

module.exports = function() {
    return function(req, res, next) {
        if (req.headers && req.headers.authorization) {

            var authorization = JSON.parse(new Buffer(req.headers.authorization, 'base64').toString('utf8'));

            if (authorization._id && authorization.secret){
                User.findById(authorization._id, function(err, user){
                    if (err) return next(err);

                    if (!user) return next();

                    user.verifyToken(authorization.token, function(err, valid){
                        if (err) return next(err);

                        if (!valid) return next();

                        req.user = user;

                        next();
                    });

                });
            }
        }else if (req.body.email && req.body.password){
            User.findOne({
                email : '' + req.body.email
            }, function(err, user){
                if (err) return next(err);

                if (!user) return next();

                user.verifyPassword(req.body.password, function(err, valid){
                    if (err) return next(err);

                    if (!valid) return next();

                    req.user = user;

                    next();
                });

            });
        }else{
            next();
        }
    };
};
