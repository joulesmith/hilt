var mongoose = require('mongoose');

var User = mongoose.model("user");

module.exports = function() {
    return function(req, res, next) {
        if (!req.headers || !req.headers.authorization) {
            // if we don't have a secret we can't verify anything.
            return next();
        }

        var authorization = JSON.parse(new Buffer(req.headers.authorization, 'base64').toString('utf8'));

        if (authorization._id && authorization.token){
            User.findById(authorization._id, function(err, user){
                if (err) return next(err);

                if (!user) return res.status(400).json({
                    'message' : 'user not found'
                });

                user.verifyToken(authorization.token, function(err, valid){
                    if (err) return next(err);

                    if (!valid) return res.status(400).json({
                        'message' : 'invalid token'
                    });

                    req.user = user;

                    next();
                });

            });
        }else if (authorization.email && authorization.password){
            User.findOne({
                email : '' + authorization.email
            }, function(err, user){
                if (err) return next(err);

                if (!user) return res.status(400).json({
                    'message' : 'user not found'
                });

                user.verifyPassword(authorization.password, function(err, valid){
                    if (err) return next(err);

                    if (!valid) return res.status(400).json({
                        'message' : 'invalid password'
                    });

                    req.user = user;

                    next();
                });

            });
        }else{
            next();
        }
    };
};
