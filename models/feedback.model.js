const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({

    username: {type:String, required:true, unique:true},

    email: {type:String, required:true, unique:true},
    
    rating: {type:String, required:true},

    description: [{
        text: {type:String, required:true},
        ratedAt: {type:Date, default: Date.now, required:true}
    }]

});

schema.set('toJSON', {virtuals:true});

module.exports = mongoose.model('Feedback', schema);