const jwt = require('jsonwebtoken')

process.SECRET_KEY = 'secret';

function auth(req, res, next){
    const token= req.header('Authorization');
    if(!token){
        res.status(401).send('token does not exist')
    };

    try{
        const decoded= jwt.verify(token, process.SECRET_KEY);
        req.user= decoded;
        next();    
    } catch(event){
        res.status(401).send('token is not valid');
    }
}

module.exports= auth;