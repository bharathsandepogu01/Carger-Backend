const express = require('express');
const router = express.Router();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const auth= require('./middleware_jwt');
const randomToken = require('random-token');

const Manager = require('../models/manager.model')
const Admin = require("../models/owner.model")
const PetrolPumps = require('../models/petrolStation.model')


router.use(cors());

process.SECRET_KEY = 'secret';

router.post('/register', register)
// router.post('/register', auth, register)

function register(req, res) {
    const managerData = {
        name: req.body.username,
        hashedPassword: req.body.hashedPassword,
        phone: req.body.phone,
        email: req.body.email,
        gender: req.body.gender,
        worksAt: {
            pId: req.body.pId,
            pName: req.body.pName,
            pAddress: req.body.pAddress
        }
    }
    // res.send('IN manaer')
    Admin.findOne({
        email: req.body.adminEmail,
        // token: req.body.token
    })
    .then(admin => {
        if(admin) {
            Manager.findOne({
                email: req.body.email
            })
            .then(manager => {
                if(!manager) {
                    bcrypt.hash(req.body.hashedPassword, 10, (err, hash) => {
                        managerData.hashedPassword = hash;
                        Manager.create(managerData)
                        .then(manager => {
                            const gen_token = randomToken(55);
                            // email.send_verification_token(gen_token, manager.email);
                            var newValues = { $set: {token: gen_token} };
                            Manager.updateOne({
                                _id: manager._id
                            }, newValues)
                            .then(manager => {
                                if(manager) {
                                    console.log("updated token")
                                }
                                else {
                                    console.log({error: "token not updated"})
                                }
                            })
                            .catch(err => {
                                console.log('error:' + err.message)
                                res.send(err)
                            });

                        res.json({status: "registed"});
                        })
                        .catch(err => {
                            var arr= Object.keys(err['errors'])
                            var errors= []
                            for(let i in arr){
                              errors.push(err['errors'][arr[i]].message);
                            }
                            console.log(errors)
                            res.send({error: errors});
                          })
                    console.log(manager)
                    })
                }
                else {
                    console.log('manager exists')
                    res.send('Manager exists')
                }
            })
            .catch(err => {
                console.log({error: err})
                res.send(err)
            })
        }
    })
}

router.post('/login', login)

function login(req, res) {
    Manager.findOne({
        email: req.body.email
    })
    .then(manager => {
        if(manager) {
            if (bcrypt.compareSync(req.body.hashedPassword, manager.hashedPassword)) {
                // Passwords match
                const payload = {
                  _id: manager._id,
                  email: manager.email
                }
                let token = jwt.sign(payload, process.SECRET_KEY, {
                  algorithm: 'HS256',
                  expiresIn: 1440
                })
                Manager.update()
                res.send(token)
              } else {
                // Passwords don't match
                res.json({ error: 'Incorrect Password' })
              }
            } else {
              res.json({ error: 'manager does not exist' })
            }
          })
          .catch(err => {
            res.send('error: ' + err)
    });
    
}
    
router.post('/shutdownstation', auth, shutdownStation)

function shutdownStation(req, res) {
    Manager.findOne({
        email: req.body.email
    })
    .then(manager => {
        if(manager) {        
            PetrolPumps.findOne({
                _id: req.body.pid
            })
            .then(petrolpumps => {
                petrolpumps.emergencyShutdown = true
                for (let index = 0; index < petrolpumps.pumps.length; index++) {
                    petrolpumps.pumps[index].shutdown = true;
                }
                petrolpumps.save(function (err) {
                    if(err) {
                        res.send('Something went wrong!')
                    }
                    res.send("Updated")
                })
            })
            .catch(err => {
                res.send(err)
            })
        }
    })
    .catch(err => {
        res.send(err)
    })
}

router.post('/startstation', auth, startStation)

function startStation(req, res) {
    Manager.findOne({
        email: req.body.email
    })
    .then(manager => {
        if(manager) {
            PetrolPumps.findOne({
                _id: req.body.pid
            })
            .then(petrolpumps => {
                petrolpumps.emergencyShutdown = false
                for (let index = 0; index < petrolpumps.pumps.length; index++) {
                    petrolpumps.pumps[index].shutdown = false;
                }
                petrolpumps.save(function (err) {
                    if(err) {
                        res.send('Something went wrong!')
                    }
                    res.send("Updated")
                })
            })
            .catch(err => {
                res.send(err)
            })
        }
    })
    .catch(err => {
        res.send(err)
    })
}

router.post('/shutdownpump', auth, shutdownPump)

function shutdownPump(req, res) {
    console.log(req)
    Manager.findOne({
        email: req.body.email
    })
    .then(manager => {
        if(manager) {
            PetrolPumps.findOne({
                _id: req.body.pid
            })
            .then(petrolpumps => {
                let customid = req.body.customid
                petrolpumps.pumps[customid].shutdown = true
                
                petrolpumps.save(function (err) {
                    if(err) {
                        res.send('Something went wrong!')
                    }
                    res.send("Updated")
                })
            })
            .catch(err => {
                res.send(err)
            })
        }
    })
    .catch(err => {
        res.send(err)
    })
}

router.post('/startuppump', auth, startupPump)


function startupPump(req, res) {
    Manager.findOne({
        email: req.body.email
    })
    .then(manager => {
        if(manager) {
            PetrolPumps.findOne({
                _id: req.body.pid
            })
            .then(petrolpumps => {
                let customid = req.body.customid
                petrolpumps.pumps[customid].shutdown = false
                petrolpumps.save(function (err) {
                    if(err) {
                        res.send('Something went wrong!')
                    }
                    res.send("Updated")
                })
            })
            .catch(err => {
                res.send(err)
            })
        }
    })
    .catch(err => {
        res.send(err)
    })
}

router.post('/updatefueldetails', auth, updateFuelDetails)

function updateFuelDetails(req, res) {
    Manager.findOne({
        _id: req.user._id
    })
    .then(manager => {
        // res.send('in update fuel details')
        if(manager) {
            // res.send('manager true')
            PetrolPumps.findOne({
                name: manager.worksAt.pName
            })
            .then(petrolpumps => {
                // res.send('petrolpumps true')
                // res.send(petrolpumps)
                for (let index = 0; index < petrolpumps.fuelDetails.length; index++) {
                    // console.log(petrolpumps.fuelDetails[index].fuel)
                    if(petrolpumps.fuelDetails[index].fuel===req.body.fuel) {
                        // res.send(petrolpumps.fuelDetails[index].fuel)
                        if(typeof req.body.quantity !== 'undefined'){
                            petrolpumps.fuelDetails[index].quantity = req.body.quantity
                        }
                        if(typeof req.body.price !== 'undefined'){
                            console.log('in price')
                            petrolpumps.fuelDetails[index].price = req.body.price
                        }
                        break;
                    }
                }
                petrolpumps.save(err => {
                    if(err){
                        res.send(err)
                    }
                    res.send('Updated')
                })
            })
            .catch(err => {
                res.send(err)
            })
        }
    })
    .catch(err => {
        res.send(err)
    })
}

router.get('/fueldetails', auth, fuelDetails)

function fuelDetails(req, res) {
    // res.send(req.header)
    // res.send('no errors till here')
    console.log('fjkdsla')
    // res.send('got the request')
    Manager.findOne({
        _id: req.user._id
    })
    .then(manager => {
        // res.send(manager)
        PetrolPumps.findOne({
            name: manager.worksAt.pName
        })
        .then(petrolpumps => {
            let details = {
                fuelDetails: petrolpumps.fuelDetails,
                pumps: petrolpumps.pumps
            }
            res.send(details)
        })
        .catch(err => {
            res.send(err)
        })
    })
    .catch(err => {
        res.send(err)
    })
}
// router.post('/addpumps/')
module.exports = router;
