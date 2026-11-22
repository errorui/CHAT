const asyncHandler = require("express-async-handler");
const { messageModel } = require("../models/messageMode");
const userModel = require("../models/userModel");
const chatModel = require("../models/chatModel");
const { requireId, getMemberChat } = require("../utils/chatAccess");
const { emitToUsers } = require("../socket");



const sendMesage=asyncHandler(async(req,res)=>{
   const {content,chatId}=req.body;
   
   if(typeof content!=="string"||!content.trim()||!chatId){
    res.status(400)
    throw new Error("Message cannot be empty")
   }
   const chat=await getMemberChat(req,res,chatId)
   let newMessage={
    sender:req.user._id,
    content:content,
    chat:chatId
   }
    let message=await messageModel.create(newMessage);
    message=await message.populate("sender","name email avatarVersion")
    message=await message.populate("chat")
    message=await userModel.populate(message,{
        path:"chat.users",
        select:"name email avatarVersion"
    })
    await chatModel.findByIdAndUpdate(req.body.chatId,{
        lastmessage:message._id,
    })

    emitToUsers(req.app.get("io"),chat.users,"message received",message)
    res.json(message)

})
const PAGE_SIZE=50
const MAX_PAGE_SIZE=100

// the newest page, or the one before the message id in ?before
const allMessages=asyncHandler(async(req,res)=>{
    const chat=await getMemberChat(req,res,req.params.chatId)
    const requested=Math.floor(Number(req.query.limit))
    const limit=requested>0?Math.min(requested,MAX_PAGE_SIZE):PAGE_SIZE

    const filter={chat:chat._id}
    const {before}=req.query
    if(before!==undefined){
        requireId(res,before,"message id")
        const cursor=await messageModel.findOne({_id:before,chat:chat._id}).select("createdAt")
        if(!cursor){
            res.status(400)
            throw new Error("That message is not in this chat")
        }
        filter.$or=[
            {createdAt:{$lt:cursor.createdAt}},
            {createdAt:cursor.createdAt,_id:{$lt:cursor._id}},
        ]
    }

    let messages=await messageModel.find(filter)
    .sort({createdAt:-1,_id:-1})
    .limit(limit)
    .populate("sender","name email avatarVersion")
    .populate("chat")
    res.json(messages.reverse())
}

)
module.exports={sendMesage,allMessages}