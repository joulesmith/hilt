var mongoose = require('mongoose');

var ProfileSchema = new mongoose.Schema({
    user : { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    name : {type : String, default : ''},
    data : {type : String, default : ''}
});

ProfileSchema.index({ name: 'text', data: 'text'});
mongoose.model('profile', ProfileSchema);
