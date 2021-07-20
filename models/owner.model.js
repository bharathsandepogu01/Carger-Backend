const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: {type:String, required:true},
    hashedPassword: {type:String, required:true},
    isAdmin: {type:Boolean, default:false},
    email: {type:String, required: [true, 'email cannot be empty'],

        validate: {
            validator: function(v) {
                var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                return re.test(v)
            },
            message: 'Please fill a valid email address'
        }

    },
    token: {type:String, default: null},
    isVerified: {type:Boolean, default: false}
});

schema.set('toJSON', {virtuals:true});

module.exports = mongoose.model('Owner', schema);