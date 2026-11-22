const asyncHandler = require("express-async-handler");
const { messageModel } = require("../models/messageMode");
const userModel = require("../models/userModel");
const chatModel = require("../models/chatModel");
const { getMemberChat } = require("../utils/chatAccess");



const sendMesage=asyncHandler(async(req,res)=>{
   const {content,chatId}=req.body;
   
   if(typeof content!=="string"||!content.trim()||!chatId){
    res.status(400)
    throw new Error("Message cannot be empty")
   }
   await getMemberChat(req,res,chatId)
   let newMessage={
    sender:req.user._id,
    content:content,
    chat:chatId
   }
    let message=await messageModel.create(newMessage);
    message=await message.populate("sender","name pic")
    message=await message.populate("chat")
    message=await userModel.populate(message,{
        path:"chat.users",
        select:"name ProfilePic email"
    })
    await chatModel.findByIdAndUpdate(req.body.chatId,{
        lastmessage:message._id,
    })

    res.json(message)

})
const allMessages=asyncHandler(async(req,res)=>{
    const chat=await getMemberChat(req,res,req.params.chatId)
    let messages=await messageModel.find({chat:chat._id})
    .sort({createdAt:1,_id:1})
    .populate("sender","name ProfilePic email")
    .populate("chat")
    res.json(messages)
}

)
module.exports={sendMesage,allMessages}