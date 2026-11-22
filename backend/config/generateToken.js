const jwt=require('jsonwebtoken')
const generateToken=(id)=>{
    return jwt.sign({id},process.env.SECRET,{
        expiresIn:"3d"
    });
}
// short lived, and only good for opening a socket
const generateSocketToken=(id)=>{
    return jwt.sign({id,scope:"socket"},process.env.SECRET,{
        expiresIn:"60s"
    });
}
module.exports={generateToken,generateSocketToken}