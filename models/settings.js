var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    model: String,
    settings : mongoose.Schema.Types.Mixed
});

mongoose.model('settings', schema);
