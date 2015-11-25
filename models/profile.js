var mongoose = require('mongoose');

var ProfileSchema = new mongoose.Schema({
    user : { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    name : {type : String, default : ''},
    sections : [mongoose.Schema.Types.Mixed]
});

mongoose.model('profile', ProfileSchema);
