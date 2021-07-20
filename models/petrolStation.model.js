const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    //pid=_id
    name: {type:String, required:true, unique:true},
    fuelDetails: [{
        fuel: {type:String, required:true},
        quantity: {type:String, required:true}, 
        price: {type:Number, required:true}
    }],
    pumps: [{
        customid: {type:String, required:true},
        shutdown: {type:Boolean, default:false},
        pumptype: {type:String, required:true}
    }],
    pendingTransactions: {type:String, default: "0"},
    estimatedTime: {type:String, default:"5 minutes"},
    address: {type:String, required:true},
    city: {type:String},
    emergencyShutdown: {type:Boolean, default:false},
    latitude: {type:String},
    longitude: {type:String},
});

schema.set('toJSON', {virtuals:true});

module.exports = mongoose.model('PetrolStation', schema);