var cron = require('node-cron');
const User = require('../models/user.model');
const Pump = require('../models/petrolStation.model');

function cronJob(data){   

    var currDate= data.date;
    var taskTime= currDate.setSeconds(currDate.getSeconds() + 600);

    var task = cron.schedule('*/5 * * * *', () => {
        if(new Date().getTime() > taskTime){
            User.findOne({
                _id: data.user
            }).then(user =>{
                for(let i=0; i < user.gasTransactions.length; i++){
                    const g = user.gasTransactions;
                    if((g[i].transactionId === data.gasid) && (g[i].status === 'initiated')){
                        
                        const pumpName = g[i].pId
                        var d = new Date();
                        var d_new = d.toISOString();
                        const newValues = {
                            $set: {
                              "gasTransactions.$.status": "cancelled",
                              "gasTransactions.$.updatedAt": d_new
                            }
                        }
                        User.updateOne({
                            "gasTransactions.transactionId": data.gasid
                        }, newValues).then(res=>{console.log('updated')})

                        const amount = g[i].cost
                        const new_bal = String(parseFloat(user.balance) + amount)
                        const newVal={
                            $set:{
                                balance: new_bal
                            }
                        }
                        User.updateOne({
                            _id: data.user
                        }, newVal)
                        .then(x =>{
                            var tid = Math.random().toString(36).substr(2, 9);
                            var f = new Date();
                            var z = f.toISOString();
                            const n= {
                                $push:{
                                  eWalletTransactions: {
                                    transactionId: tid,
                                    status: 'completed',
                                    type: 'credit',
                                    createdAt: z,
                                    amount: amount
                                  }
                                }
                            }
                            
                            User.updateOne({
                                _id: data.user
                            }, n).then(q=>{
                                
                                Pump.findOne({
                                    name: pumpName
                                }).then(pump=>{
                                       if(pump){
                                        var count= String(parseFloat(pump.pendingTransactions)-1)
                                        var estd = String(Math.ceil(parseFloat(count)/pump.pumps.length)*5)+"minutes"
                                        const newData={
                                          $set:{
                                            pendingTransactions: count,
                                            estimatedTime: estd
                                          }
                                        }
                                        
                                        Pump.updateOne({
                                          name: pumpName
                                        }, newData).then(r=>{console.log("updated estimated time")})        
                                       }
                                       else{
                                           console.log("pump not found")
                                       } 
                                })
                            }) 
                        })
                    }

                }
            })
            task.stop();
        }
        else{
             console.log("cronJob running");
        }

    },{scheduled: false});
    
    task.start();
};    

module.exports= cronJob;