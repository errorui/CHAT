const asyncHandler = require("express-async-handler");
const chatModel = require("../models/chatModel");
const usermodel = require("../models/userModel");
const { Error } = require("mongoose");

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const accessChat = asyncHandler(async (req, res) => {
     const {userId}=req.body
    
     if(!userId){
        console.log("user id paraeam not sent with request")
        return res.sendStatus(400);
     }
     var isChat=await chatModel.find({
        isGroupChat:false,
        $and:[
            {users:{$elemMatch:{
                $eq:req.user._id
            }}},
            {users:{$elemMatch:{
                $eq:userId
            }}},
        ]
     }).populate("users","-password").populate("lastmessage")

     isChat=await usermodel.populate(isChat,{
        path:"lastestMessage.sender",
        select:"name pic email"
     })
     if(isChat.length>0) {
        res.send(isChat[0]);
     }else{
        var chatData={
            chatName:"sender",
            isGroupChat:false,
            users:[req.user._id,userId],
        }
        try {
            const createdchat=await chatModel.create(chatData)
            const FullChat=await chatModel.findOne({_id:createdchat._id}).populate("users","-password");
            res.status(200).send(FullChat);
        } catch (error) {
            res.status(400);
            throw new Error(error.message)
        }
     }
});

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = asyncHandler(async (req, res) => {
 try {
  
    let data=await chatModel.find({users:{$elemMatch:{$eq:req.user._id}}})
    .populate("users","-password").populate("groupAdmin","-password").populate("lastmessage").sort({updateAt:-1})
    data=await usermodel.populate(data,{
        path:"lastestMessage.sender",
        select:"name pic email"
     })
  
    res.send(data);
 } catch (error) {
    res.send(error.message)
 }
});

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
const createGroupChat = asyncHandler(async (req, res) => {
 if(!req.body.users||!req.body.name){
  console.log("working1?")
   return res.status(400).send({message:"Please fill all the fields"})
 }
 let users=JSON.parse(req.body.users);
 if(users.length<2){
  console.log("working2?")
   return res.status(400).send("more than 2 users are required")
 }
 users.push(req.user)
 try {
   
   const groupChat=await chatModel.create({
      chatName:req.body.name,
      users:users,
      isGroupChat:true,
      groupAdmin:req.user,
   })
   const fullgroupChat= await chatModel.findOne({_id:groupChat._id})
   .populate("users","-password").populate("groupAdmin","-password");
   res.status(200).json(fullgroupChat)
 } catch (error) {
    res.status(400).json(error.message)
 }
  
});

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
const renameGroup = asyncHandler(async (req, res) => {
   const { chatId, chatName } = req.body;
   
   const updatedChat = await chatModel.findByIdAndUpdate(
     chatId,
     {
       chatName: chatName,
     },
     {
       new: true,
     }
   ).populate("users", "-password").populate("groupAdmin", "-password");
  

  
   if (!updatedChat) {
     res.status(404);
     throw new Error("Chat Not Found");
   } else {
     res.json(updatedChat);
   }
});

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // Find the chat first to get current users and admin
  const chat = await chatModel.findById(chatId);

  if (!chat) {
    res.status(404);
    throw new Error("Chat Not Found");
  }

  // Check if the requester is admin
  const isAdminLeaving = chat.groupAdmin.equals(userId);

  // Remove the user from the chat
  const updatedChat = await chatModel.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    {
      new: true,
    }
  ).populate("users", "-password").populate("groupAdmin", "-password");
  
  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } 

  if (updatedChat.users.length === 0) {

    await chatModel.findByIdAndDelete(chatId);
    res.json({ message: "Chat deleted as no users left" });
  } else if (isAdminLeaving) {
  
    updatedChat.groupAdmin = updatedChat.users[0];
    await updatedChat.save();
    res.json(updatedChat);
  } else {
  
    res.json(updatedChat);
  }
});

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const addToGroup = asyncHandler(async (req, res) => {
   const { chatId, userId } = req.body;

  // check if the requester is admin

  const added = await chatModel.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};