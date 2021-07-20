const express = require('express');
const router = express.Router();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('./middleware_jwt');
const randomToken = require('random-token');

const Admin = require('../models/owner.model');
const PetrolStation = require('../models/petrolStation.model')
const email = require('./send_email')

router.use(cors());

process.SECRET_KEY = 'secret';

router.post('/register', register_admin)

// function createSuperUser() {
//     Admin.findOne({
//         email: "pras@gmail.com"
//     })
//     .then(admin => {
//         if(!admin) {

//         }
//     })
// }



// router.post('/addsuperuser', addSuperUser);

// function addSuperUser(req, res) {
//   const admin_data = {
//     name: req.body.username,
//     hashedPassword: req.body.hashedPassword,
//     email: req.body.email,
//     isAdmin: true
//   }
//   bcrypt.hash(req.body.hashedPassword, 10, (err, hash) => {
//     admin_data.hashedPassword = hash;
//     Admin.create(admin_data)
//       .then(user => {

//         const gen_token = randomToken(55);

//         // email.send_verification_token(gen_token, user.email);

//         var newValues = {
//           $set: {
//             token: gen_token
//           }
//         };

//         Admin.updateOne({
//           _id: user._id
//         }, newValues)
//           .then(user => {
//             if (user) {
//               console.log("updated token")
//             } else {
//               console.log({
//                 error: "token not updated"
//               })
//             }
//           })
//           .catch(err => {
//             console.log('error:' + err.message)
//           });

//         res.json({
//           status: "registered"
//         });
//       })

//       .catch(err => {
//         var arr = Object.keys(err['errors'])
//         var errors = []
//         for (i in arr) {
//           errors.push(err['errors'][arr[i]].message);
//         }
//         console.log(errors)
//         res.json({
//           error: errors
//         });
//       })

//     console.log(admin_data)
//   }

function register_admin(req, res) {
  const admin_data = {
    name: req.body.username,
    hashedPassword: req.body.hashedPassword,
    email: req.body.email
  }

  Admin.findOne({
    name: req.body.superAdmin,
    isAdmin: true
  })
    .then(super_admin => {
      if (super_admin) {
        Admin.findOne({
          email: req.body.email
        })
          .then(admin => {
            if (!admin) {
              bcrypt.hash(req.body.hashedPassword, 10, (err, hash) => {
                admin_data.hashedPassword = hash;
                Admin.create(admin_data)
                  .then(user => {

                    const gen_token = randomToken(55);

                    // email.send_verification_token(gen_token, user.email);

                    var newValues = {
                      $set: {
                        token: gen_token
                      }
                    };

                    Admin.updateOne({
                      _id: user._id
                    }, newValues)
                      .then(user => {
                        if (user) {
                          console.log("updated token")
                        } else {
                          console.log({
                            error: "token not updated"
                          })
                        }
                      })
                      .catch(err => {
                        console.log('error:' + err.message)
                      });

                    res.json({
                      status: "registered"
                    });
                  })

                  .catch(err => {
                    var arr = Object.keys(err['errors'])
                    var errors = []
                    for (let i in arr) {
                      errors.push(err['errors'][arr[i]].message);
                    }
                    console.log(errors)
                    res.json({
                      error: errors
                    });
                  })

                console.log(admin_data)
              })
            } else {
              console.log('admin exist')
            }
          })
          .catch(err => {
            console.log({
              error: err
            })
          })
      } else {
        console.log({
          error: "super admin not found"
        })
      }
    })
    .catch(err => {
      console.log({
        error: err
      })
    })
}

router.post('/login', login)

function login(req, res) {
  Admin.findOne({
    email: req.body.email
  })
    .then(admin => {
      if (admin) {
        if (bcrypt.compareSync(req.body.hashedPassword, admin.hashedPassword)) {
          // Passwords match
          const payload = {
            _id: admin._id,
            email: admin.email
          }
          let token = jwt.sign(payload, process.SECRET_KEY, {
            algorithm: 'HS256',
            expiresIn: 1440
          })
          res.send(token)
        } else {
          // Passwords don't match
          res.json({
            error: 'Incorrect Password'
          })
          console.log("Failed, password is ",req.body.hashedPassword)
        }
      } else {
        res.json({
          error: 'Admin does not exist'
        })
      }
    })
    .catch(err => {
      res.send('error: ' + err)
    });

}

router.post('/addstation', auth, addStation)

function addStation(req, res) {
  // send dieselpumps, petrolpumps, cngpumps
  const petrolstationdata = {
    name: req.body.name,
    fuelDetails: req.body.fuelDetails,
    address: req.body.address,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    pumps: []
  }
  // res.send('done')

  // res.body.fuelDetails is array of objects

  Admin.findOne({
    email: req.user.email
  })
    .then(admin => {
      if (admin) {
        PetrolStation.findOne({
          name: req.body.name
        })
          .then(petrol => {
            if (!petrol) {
              let tempid = 1;
              let fueltype = ["Petrol", "Diesel", "CNG"];
              let pumpcount = [req.body.petrolpumps, req.body.dieselpumps, req.body.cngpumps];
              for (let i = 0; i < pumpcount.length; i++) {
                while (pumpcount[i]--) {
                  var p = {
                    customid: tempid++,
                    pumptype: fueltype[i]
                  }
                  petrolstationdata.pumps.push(p)
                }
              }
              console.log(petrolstationdata)
              PetrolStation.create(petrolstationdata)
              .then(added=>{
                console.log(added);
                res.send('Petrol Station added')
              })
              .catch(err => {
                console.log(err);
                res.send('Petrol Station failed to add')
              });
            } else {
              res.json({
                error: "Petrol Station already exists"
              })
            }
          })
          .catch(err => {
            res.json({ error: err })
          })
      }
      else {
        res.json({ error: 'Admin not valid' })
      }
    })
    .catch(err => {
      res.json({ error: err })
    })
}


router.get('/getpetrolpump', getpetrolpump);

function getpetrolpump(req, res) {
  PetrolStation.findOne({
    name: req.body.name
  })
    .then(petrol => {
      console.log(petrol)
      res.send(petrol)
    })
}


module.exports = router;