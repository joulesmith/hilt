var mongoose = require('mongoose');

var User = mongoose.model("user");

module.exports = function() {
    return function(req, res, next) {
        try {

            if (req.body.email && req.body.password){
                User.findOne({
                    email : '' + req.body.email
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
                }, function(error){
                    next(error);
                });

            }else if (req.headers && req.headers.authorization && req.headers.authorization !== '') {

                var token = JSON.parse(new Buffer(req.headers.authorization, 'base64').toString('utf8'));

                if (token._id && token.secret){
                    User.findById(token._id).exec()
                    .then(function(user){
                        if (!user) return next();

                        return user.verifyToken(token);
                    })
                    .then(function(valid){
                        if (valid) {
                            req.user = user;
                        }

                        next();
                    }, function(error){
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
