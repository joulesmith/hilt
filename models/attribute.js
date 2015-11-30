var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    name : {type : String, default : ''}
});


mongoose.model('attribute', Schema);
