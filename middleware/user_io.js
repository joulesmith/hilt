var mongoose = require('mongoose');



module.exports = function(socket) {
  var User = mongoose.model("user");
  
  socket.on('authenticate', function(data) {
    var token = JSON.parse(new Buffer(data.authorization, 'base64').toString('utf8'));

    if (token._id && token.secret) {
      User.findById(token._id).exec()
        .then(function(user) {
          if (!user) {
            throw 1;
          }

          return user.verifyToken(token);
        })
        .then(function(user) {
          if (!user) {
            throw 1;
          }

          socket.user = user;

        })
        .catch(function(error) {
          socket.disconnect('unauthorized');
        });
    }
  });
};
