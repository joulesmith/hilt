
var app = null;
var io = null;


exports.set_io = function(new_io) {
    io = new_io;
};

exports.get_io = function() {
    return io;
};

exports.set_app = function(new_app) {
    app = new_app;
};

exports.get_app = function() {
    return app;
};
