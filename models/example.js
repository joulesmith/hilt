var mongoose = require('mongoose');

var ExampleSchema = new mongoose.Schema({
    user : { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    content : {type : String, default : ''}
});

mongoose.model('example', Example);
