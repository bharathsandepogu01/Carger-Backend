const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    
    username: {type:String, required:[true, 'Username cannot be empty']},

    hashedPassword: {type:String, required:[true, 'Password cannot be empty']},

    phone: { type:Number, required: [true, 'Phone number cannot be empty'],

        validate: {
            validator: function(v) {
                var re = /^\d{10}$/;
                return re.test(v)
            },
            message: 'Phone number must be 10 digit number'
        }
    
    },

    email: {type:String, required: [true, 'email cannot be empty'],

        validate: {
            validator: function(v) {
                var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                return re.test(v)
            },
            message: 'Please fill a valid email address'
        }

    },

    isVerified: {type:Boolean, default: false},
    
    token: {type:String, default: null},
    
    gender: {type:String, enum: ['Male', 'Female', 'Prefer not to say'], default:'Prefer not to say'},
    
    eId: {type:String},
    
    balance: {type:String, default: '0.00' },
    
    eWalletPin: {type:String},
    
    gasTransactions: [{
        transactionId: {type:String, required:true},

        fuelType: {type:String, required:true},

        fuelPrice: {type:Number, required:true},

        quantity: {type:Number, required:true}, 

        cost: {type:Number, required:true},

        status: {type:String, enum:['initiated', 'processing', 'completed', 'cancelled'], required:true},

        pId: {type:String, required:true}, //Petrol station ID

        pumpId: {type:String},

        createdAt: {type:Date, default: Date.now, required:true},

        updatedAt: {type:Date, default: Date.now, required:true},

        eWalletTransactionId: {type:String, required : true},

        otp:  {type:String}
    }],

    eWalletTransactions: [{
        transactionId: {type:String, required:true},

        status: {type:String, enum:['initiated', 'processing', 'completed', 'failed'], required:true},

        type: {type:String, enum:['credit', 'debit']},

        createdAt: {type:Date, default: Date.now, required:true},

        updatedAt: {type:Date, default: Date.now, required:true}, 

        amount: {type:String, required:true}

    }]
    
});

schema.set('toJSON', {virtuals:true});

module.exports = mongoose.model('User', schema);