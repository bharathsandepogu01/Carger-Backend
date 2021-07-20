const express = require('express');
const paypal = require('paypal-rest-sdk');
const User= require('../models/user.model');


function pay(details, callback) {
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://192.168.0.125:8008/user/success",
            "cancel_url": "http://192.168.0.125:8008/user/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "CARGER Ewallet",
                    "sku": "001",
                    "price": details.amount,
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": details.amount,
            },
            "description": "Hat for the best team ever"
        }]
    };

    console.log(details.amount)

    paypal.payment.create(create_payment_json, function (error, payment) {
       callback(error, payment)            
      });
}

function success(data, callback){

    User.findOne({
        "eWalletTransactions.transactionId": data.paymentId 
      })
      .then(user => {
         for(let i=0; i<user.eWalletTransactions.length; i++){
           if(user.eWalletTransactions[i].transactionId === data.paymentId){
                
                let final_amount = user.eWalletTransactions[i].amount
                
                const execute_payment_json = {
                    "payer_id": data.payerId,
                    "transactions": [{
                        "amount": {
                            "currency": "USD",
                            "total": final_amount
                        }
                    }]
                };
            
                paypal.payment.execute(data.paymentId, execute_payment_json, function (error, payment) {
                 callback(error, payment)
                });
           }
         } 
      }).catch(err=>{
        console.log(err)
        callback({error: err})
      })
    
}

function update_balance(data){
    
    User.findOne({
       "eWalletTransactions.transactionId": data._id
    })
    .then(user=>{
        if(!user){
            console.log("no user exist")
        }
        else{
            if(data.type === 'credit'){
                let init_balance = parseFloat(user.balance);
                let total= String(parseFloat(data.amount) + init_balance);
                console.log(total, init_balance, data.amount)
                
                const newValues={
                    $set:{
                        balance: total
                    }
                }

                User.updateOne({
                    _id: user._id
                }, newValues)
                .then(user=>{
                    console.log(user)
                })
                .catch(err=>{
                    console.log(err)
                })
            console.log(newValues)
            }
            else if(data.type === 'debit'){
                let init_balance = parseFloat(user.balance);
                let total= init_balance - parseFloat(data.amount) ;
                console.log(total)
                
                const newValues={
                    $set:{
                        balance: toString(total)
                    }
                }

            }

            else{
                console.log("error")
            }
            
        }
    })

}


// function g(loc){
//     lis = []
//     User.find({})
//    .then(u => {
//         for(let i = 0; i < u.length; i++){
//             console.log('length of users list:-', u.length)
//             // d = u[i].latitude + ',' + u[i].longitude
//             googleMapsClient.directions({
//                 origin: loc.lat + ',' + loc.lng,
//                 destination: '33.8068768,-118.3527671',
//                 units: 'metric'
//             })
//             .asPromise()
//             .then(response =>{
//                 d = response.json.routes[0].legs[0].distance.text
//                     x = d.split(" ")
//                     if(parseFloat(x[0]) < 100){
//                         lis.push(i)
//                         console.log(lis)
//                     }
//                     console.log(response.json);
//             })
//             .catch(err =>{
//                 return err
//             })
//             setTimeout(doSomething, 3000)
//         }
//    })
//    .catch(err =>{
//        return err
//    })

//    console.log('after interval')
//    function doSomething(){
//     console.log('time', lis)
//     return lis
// }
// }

module.exports= {pay, success, update_balance}