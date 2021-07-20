const express= require('express');
const cors= require('cors');
const mongoose= require('mongoose');
const bodyParser = require('body-parser');
const app= express();
const port= process.env.PORT || 8001;
const paypal= require('paypal-rest-sdk');


app.use(cors());

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AfiQt3Lo69K_jTV_YZ-XhfK0jjMFkz9xJ49kpUijjBTP8TGMLPbya1VKlGeeULe94wy7tDECEiPCNEGT',
    'client_secret': 'EPgwL7eU8hEnRVqhoRuXNA9iFnkHSzviaOfJQZ9fU18mLaYkNDLjRpKJGRsS5Z4UGtYA8rY9VGJr83MK'
  });


const uri = 'mongodb+srv://CargerAdmin:cPVJr1Bbf8RModOZ@carger.btrpm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
mongoose.connect(uri, {useNewUrlParser: true});

// mongoose.connect('mongodb://localhost:27017/cargerdb', {useNewUrlParser: true});

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const connection = mongoose.connection;

connection.once('open', function(){
    console.log("connected");
});

const route = require('./routes/user');
const adminroutes = require('./routes/owner');
const pupmroutes = require('./routes/pumpFunctions');
const managerroutes = require('./routes/manager');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use('/user', route);
app.use('/admin', adminroutes);
app.use('/pump', pupmroutes);
app.use('/manager', managerroutes);
app.listen(port, () => console.info('REST API running on port '+ port));
