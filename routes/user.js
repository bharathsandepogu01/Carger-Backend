const express = require('express');
const router = express.Router();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const auth = require('./middleware_jwt');
const randomToken = require('random-token');

const User = require('../models/user.model');
const Pump = require('../models/petrolStation.model')
const Review = require('../models/feedback.model')
const cronJob= require('../time_schedule/cancel_order');


const PetrolPumps = require('../models/petrolStation.model');

const email = require('./send_email');

const transaction = require('./transaction')

router.use(cors());

process.SECRET_KEY = 'secret';



router.post('/register', register)

function register(req, res) {

  const userData = {
    username: req.body.username,
    hashedPassword: req.body.hashedPassword,
    phone: req.body.phone,
    email: req.body.email,
    gender: req.body.gender
  }
  User.findOne({
    email: req.body.email
  })
    .then(user => {
      if (!user) {
        bcrypt.hash(req.body.hashedPassword, 4, (err, hash) => {
          userData.hashedPassword = hash
          User.create(userData)
            .then(user => {

              const gen_token = randomToken(55);

              email.send_verification_token(gen_token, user.email);

              var newValues = { $set: { token: gen_token } };

              User.updateOne({
                _id: user._id
              }, newValues)
                .then(user => {
                  if (user) {
                    console.log("updated token")
                  }
                  else {
                    console.log({ error: "token not updated" })
                  }
                })
                .catch(err => {
                  console.log('error:' + err.message)
                });

              res.status(200).json({ status: "registered and a link is sent to your email to get your email verified" });
            })

            .catch(err => {
              var arr = Object.keys(err['errors'])
              var errors = []
              for (let i in arr) {
                errors.push(err['errors'][arr[i]].message);
              }
              console.log(errors)
              res.status(400).json({ error: errors });
            })
        })
      }
      else {
        res.status(409).json({ error: 'user already exist' });
      }
    })
    .catch(err => {
      var arr = Object.keys(err['errors'])
      var errors = []
      for (let i in arr) {
        errors.push(err['errors'][arr[i]].message);
      }
      console.log(errors)
      res.status(401).json({ error: errors });
    })


}




router.post('/login', login)

function login(req, res) {
  User.findOne({
    email: req.body.email
  })
    .then(user => {
      if (user) {
        if (bcrypt.compareSync(req.body.hashedPassword, user.hashedPassword)) {
          // Passwords match
          const payload = {
            _id: user._id,
            email: user.email,
            username: user.username
          }
          let token = jwt.sign(payload, process.SECRET_KEY, {
            algorithm: 'HS256',
            expiresIn: 86400,
          })
          res.send(token)
        } else {
          // Passwords don't match
          res.status(403).json({ error: 'Incorrect Password' })
        }
      } else {
        res.status(404).json({ error: 'User does not exist' })
      }
    })
    .catch(err => {
      res.status(400).send('error: ' + err)
    });

}




router.get('/profile', auth, profile)

function profile(req, res) {

  User.findOne({
    _id: req.user._id
  })
    .then(user => {
      if (user) {
        res.send(user)
      }
      else {
        res.status(404).json({ error: "user does not exist" })
      }
    })
    .catch(err => {
      res.status(400).send('error:' + err)
    });

}




router.delete('/delete', delete_user)

function delete_user(req, res) {

  User.findOneAndDelete({
    email: req.body.email
  })
    .then(user => {
      if (user) {
        console.log("user deleted")
        res.send("user deleted")
      }
      else {
        res.status(404).json({ error: "not deleted" })
      }
    })
    .catch(err => {
      res.status(400).json('error:' + err)
    });

}



router.post('/get_verified', auth, resend_token)

function resend_token(req, res) {

  User.findOne({
    _id: req.user._id
  })
    .then(user => {
      if (user) {
        email.send_verification_token(user.token, user.email)
        res.json({ status: "resent verification token" })
      }
      else {
        res.json({ error: "Not a valid user" })
      }
    })
    .catch(err => {
      res.json({ error: err })
    });

}




router.get('/verify/:token', confirm_email)

function confirm_email(req, res) {

  let randToken = req.params.token;
  var newValues = { $set: { isVerified: true } };

  User.findOneAndUpdate({
    token: randToken
  }, newValues)
    .then(user => {
      if (user) {
        res.redirect('http://localhost:3000/#/Email_Verification/1')
      }
      else {
        res.json({ error: "not verified" })
        res.redirect('http://localhost:3000/#/Email_Verification/0')
      }
    })
    .catch(err => {
      res.json('error:' + err)
      res.redirect('http://localhost:3000/#/Email_Verification/0')
    });

}




router.post('/add_money_to_wallet', auth, add_money)

function add_money(req, res) {
  console.log('add money to wallet called!!!');
  transaction.pay(req.body, function (err, payment) {
    if (err) {
      res.status(502).send('problem with bank!!!')
    }
    else {
      
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === 'approval_url') {
          res.json({ link: payment.links[i].href })
        }
      }

      const newValues = {
        $push: {
          eWalletTransactions: {
            transactionId: payment.id,
            status: 'initiated',
            type: 'credit',
            createdAt: payment.create_time,
            amount: req.body.amount
          }
        }
      }

      User.updateOne({
        _id: req.user._id
      }, newValues)
        .then(add => {
          if (add) {
            console.log("transaction added!!!")
          }
          else {
            console.log("transaction not added")
          }
        })
        .catch(err => {
          console.log({ error: err })
        })

    }

  });
}




router.get('/success', success)

function success(req, res) {
  const data = {
    payerId: req.query.PayerID,
    paymentId: req.query.paymentId,
  }

  console.log(data);

  transaction.success(data, function (err, response) {
    console.log(response)
    if (err) {
      console.log(err)
      res.status(402).send(err)
    }
    else {
      const newValues = {
        $set: {
          "eWalletTransactions.$.status": "completed",
          "eWalletTransactions.$.updatedAt": response.update_time
        }
      }
      User.updateOne({
        "eWalletTransactions.transactionId": response.id
      }, newValues)
        .then(user => {
          console.log(user)
          const data = {
            _id: response.id,
            type: 'credit',
            amount: response.transactions[0].amount.total
          }

          transaction.update_balance(data)

          res.send('updated wallet')
        })
        .catch(err => {
          console.log(err)
        })
    }
  })

}




router.get('/cancel', cancel)

function cancel(req, res) {
  console.log(req.query);
  res.send('Cancelled');
}


router.post('/buy_fuel', auth, buy_fuel)

function buy_fuel(req, res){
      
      User.findOne({
        email:req.user.email
      })
      .then(user=>{
        if(user){
          
        }
      })
}


router.post('/gas_trans', auth, gas_trans)

function gas_trans(req, res) {
  Pump.findOne({
    name: req.body.name
  })
    .then(pump =>{
      if(pump){
        var cost_pl = 0
        var pump_quan = 0
        for(let i = 0; i < pump.fuelDetails.length; i++){
          if(pump.fuelDetails[i].fuel === req.body.type){   
            cost_pl = pump.fuelDetails[i].price
            pump_quan = pump.fuelDetails[i].quantity
          }
        }
        if(parseFloat(req.body.quantity) < pump_quan){
          User.findOne({
            _id: req.user._id
          })
            .then(user =>{
              if(user){
                if(parseFloat(user.balance) >= parseFloat(req.body.total)){
                  let total_cost = cost_pl * req.body.quantity
                  if(total_cost === req.body.total){
                    var x = parseFloat(user.balance) - total_cost
                    const newVal={
                      $set:{
                          balance: x
                      }
                    }
                    User.updateOne({
                      _id: user._id
                    }, newVal)
                      .then(y =>{
                        if(y.ok === 1){
                          var tid = Math.random().toString(36).substr(2, 9);
                          var f = new Date();
                          var z = f.toISOString();
                          const newValues= {
                            $push:{
                              eWalletTransactions: {
                                transactionId: tid,
                                status: 'completed',
                                type: 'debit',
                                createdAt: z,
                                amount: total_cost
                              }
                            }
                          }
                          User.updateOne({
                            _id: req.user._id
                          }, newValues)
                          .then(m =>{
                            console.log(m)
                          })
                          .catch(err => {
                            console.log(err)
                          })

                          var gid = Math.random().toString(36).substr(2, 9);
                          var j = new Date();
                          var k = j.toISOString();
                          var ot  = Math.floor(100000 + Math.random() * 900000)
                          const n= {
                            $push:{
                              gasTransactions: {
                                transactionId: gid,
                                fuelType: req.body.type,
                                fuelPrice: cost_pl,
                                quantity: req.body.quantity,
                                cost: total_cost,
                                status: 'initiated',
                                pId: req.body.name,
                                createdAt: k,
                                eWalletTransactionId: tid,
                                otp: ot
                              }
                            }
                          }
                          User.updateOne({
                            _id: req.user._id
                          }, n)
                          .then(w =>{
                            const data= {
                              date: j,
                              user: req.user._id,
                              gasid: gid
                            }
                            cronJob(data)
                            
                            var count= String(parseFloat(pump.pendingTransactions)+1)
                            var estd = String(Math.ceil(parseFloat(count)/pump.pumps.length)*5)+"minutes"
                            const newData={
                              $set:{
                                pendingTransactions: count,
                                estimatedTime: estd
                              }
                            }

                            Pump.updateOne({
                              name: req.body.name
                            }, newData).then(r=>{console.log("updated estimated time")})
                    
                            res.send('Updated')
                          })
                          .catch(err => {
                            console.log(err)
                          })
                              }
                            })
                        }
                  else{
                    res.status(400).send({error: 'Invalid Data'});
                  }
                }
                else{
                  res.status(400).send({error: 'Not enough wallet balance.Please add money to wallet'})
                }
              }
              else{
                res.status(404).send({error: 'no user found!!!'})
              }
            })
            .catch(err=>{
              res.status(403).json({error:err})
            })
          } 
        else{
          res.status(400).send({error: 'Not enough fuel in this outlet'})
        }
      }
    })
    .catch(err=>{
      res.status(401).json({error:err})
    })
}


function distanceCalculation(lat1,
  lat2, lon1, lon2)
  {

  // The math module contains a function
  // named toRadians which converts from
  // degrees to radians.
  lon1 =  lon1 * Math.PI / 180;
  lon2 = lon2 * Math.PI / 180;
  lat1 = lat1 * Math.PI / 180;
  lat2 = lat2 * Math.PI / 180;

  // Haversine formula
  let dlon = lon2 - lon1;
  let dlat = lat2 - lat1;
  let a = Math.pow(Math.sin(dlat / 2), 2)
  + Math.cos(lat1) * Math.cos(lat2)
  * Math.pow(Math.sin(dlon / 2),2);

  let c = 2 * Math.asin(Math.sqrt(a));

  // Radius of earth in kilometers. Use 3956
  // for miles
  let r = 6371;

  // calculate the result
  return(Math.floor(c * r));
}


router.post('/gmap', auth, gmap)

async function gmap(req, res) {
  const lat = req.body.lat
  const lng = req.body.lng

  let us = []
  let lis = []
  await Pump.find({})
    .then(u => {
      us = u;
      for(let i = 0; i < us.length; i++){
        let value = us[i];
        value['_doc']['distance'] = distanceCalculation(lat, us[i].latitude, lng, us[i].longitude);
        lis.push(value);
      };
      res.send(lis);
  }).catch(err => {
      res.status(404).json({error: 'something went wrong, please try again!'});
  });
}


router.post('/pending_trans', auth, pending_trans)

function pending_trans(req, res) {
  let list = []
  User.findOne({
    _id: req.user._id
  })
    .then(user =>{
      for(let i=0; i < user.gasTransactions.length; i++){
        if(user.gasTransactions[i].status === 'initiated'){
          list.push(user.gasTransactions[i])
        }
      }
      res.send(list)
    })
}


router.get('/show', show);

function show(req, res) {
  User.findOne({
  })
  .then(user => {
    res.send(user)
  })
}


router.get('/getPetrolPumps', getPetrolPumps);

function getPetrolPumps(req, res) {
  PetrolPumps.find({})
  .then(petrolpumps => {
    res.send(petrolpumps)
  })
  .catch(err => {
    res.status(400).error(err)
  })
};


router.post('/review', auth, review)

function review(req, res){

  Review.findOne({
    email: req.user.email
  }).then(user=>{
    if(!user){
      const newData= {
        username: req.user.username,
        email: req.user.email,
        rating: req.body.rating,
      }

      Review.create(newData).then(created=>{

          var d = new Date();
          var d_new = d.toISOString();
          const newValues = {
            $push: {
              description: {
                text: req.body.text,
                ratedAt: d_new              }
            }
          }

          Review.updateOne({
            email: req.user.email
          }, newValues)
          .then(updated=>{
            res.send('Posted Successfully')
          })
      })
    }

    else{        

      Review.updateOne({
        email: req.user.email
      }, {$set:{rating:req.body.rating}}).then(updated=>{
            console.log("updated rating")
            var d = new Date();
            var d_new = d.toISOString();
            const newValues = {
              $push: {
                description: {
                  text: req.body.text,
                  ratedAt: d_new 
                }
              }
            }

            Review.updateOne({
              email: req.user.email
            }, newValues).then(updated2=>{
                res.send("updated all")
            })
        })
    }
  }).catch(err=>{
    res.send(err)
  })

}


module.exports = router;
