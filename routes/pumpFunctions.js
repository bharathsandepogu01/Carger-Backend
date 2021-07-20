const express = require('express');
const router = express.Router();
const cors = require('cors');

const User = require('../models/user.model');
const Pump = require('../models/petrolStation.model')


router.use(cors());

process.SECRET_KEY = 'secret';

router.post('/fill_gas', fill_gas)

function fill_gas(req, res) {

  User.findOne({
    email:  req.body.email 
  }).then(user=>{
      if(!user){
          res.json({error: 'user not found'})
      }
      else{
          for(let i=0; i<user.gasTransactions.length; i++){
            const gasDetail= user.gasTransactions;
            if(gasDetail[i].status === 'initiated' && gasDetail[i].otp === req.body.otp){
              
                var d = new Date();
                var d_new = d.toISOString();
            
                const newValues = {
                    $set: {
                    "gasTransactions.$.status": "completed",
                    "gasTransactions.$.updatedAt": d_new
                    }
                }

                User.updateOne({
                    email: req.body.email,
                    "gasTransactions.otp": req.body.otp
                }, newValues).then(updated=>{
                    console.log('Thank you for using!!!')
                })

                const quantity= gasDetail[i].quantity;
                const station= gasDetail[i].pId;
                const fuelType= gasDetail[i].fuelType;

                Pump.findOne({
                    name: station
                }).then(pump=>{
                    for(let j=0; j<pump.fuelDetails.length; j++){
                        const fuel= pump.fuelDetails;
                        if(fuel[j].fuel === fuelType){
                            var new_q = parseFloat(fuel[j].quantity) - parseFloat(quantity)
                            new_q = String(new_q)

                            const newValues = {
                                $set: {
                                    "fuelDetails.$.quantity": new_q,
                                }
                            }

                            Pump.updateOne({
                                name: station,
                                "fuelDetails.fuel": fuelType
                            }, newValues).then(fuelUpdate=>{
                                res.send('Fuel Updated in Outlet')
                            })
                        }
                    }
                })
            }
        
        }
    }
  })
  .catch(err=>{
      res.send(err)
  })
}

module.exports = router;
