const asyncHandler = require("express-async-handler");
const { messageModel } = require("../models/messageMode");
const userModel = require("../models/userModel");
const chatModel = require("../models/chatModel");



const sendMesage=asyncHandler(async(req,res)=>{
   const {content,chatId}=req.body;
   
   if(!content||!chatId){
    console.log("Invalid data passed into request")
    return res.sendStatus(400)
   }
   let newMessage={
    sender:req.user._id,
    content:content,
    chat:chatId
   }
   try {
    let message=await messageModel.create(newMessage);
    message=await message.populate("sender","name pic")
    message=await message.populate("chat")
    message=await userModel.populate(message,{
        path:"chat.users",
        select:"name ProfilePic email"
    })
    await chatModel.findByIdAndUpdate(req.body.chatId,{
        lastest:message,
    })

    res.json(message)
   } catch (error) {
     return res.status(400).send(error.message)
   }

})
const allMessages=asyncHandler(async(req,res)=>{
    try {
        let messages=await messageModel.find({chat:req.params.chatId})
        .populate("sender","name ProfilePic email")
        .populate("chat")
        res.json(messages)
    } catch (error) {
        res.status(400).send(error.message)
    }
}

)
module.exports={sendMesage,allMessages}