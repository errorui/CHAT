const asyncHandler = require("express-async-handler");
const chatModel = require("../models/chatModel");
const usermodel = require("../models/userModel");
const { messageModel } = require("../models/messageMode");
const { isValidId, requireId, getMemberGroup, getAdminGroup } = require("../utils/chatAccess");
const { emitToUsers } = require("../socket");

const notifyMembers = (req, chatId, userIds) =>
  emitToUsers(req.app.get("io"), userIds, "chats changed", { chatId });

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const accessChat = asyncHandler(async (req, res) => {
     const {userId}=req.body
    
     requireId(res, userId, "user id");
     if (req.user._id.equals(userId)) {
       res.status(400);
       throw new Error("You cannot chat with yourself");
     }
     if (!(await usermodel.exists({ _id: userId }))) {
       res.status(404);
       throw new Error("User Not Found");
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
        path:"lastmessage.sender",
        select:"name email"
     })
     if(isChat.length>0) {
        res.send(isChat[0]);
     }else{
        var chatData={
            chatName:"sender",
            isGroupChat:false,
            users:[req.user._id,userId],
            directKey:[String(req.user._id),userId.toLowerCase()].sort().join(":"),
        }
            const createdchat=await chatModel.create(chatData).catch((error)=>{
              if(error.code!==11000) throw error;
              // a simultaneous request created it first
              return chatModel.findOne({directKey:chatData.directKey});
            })
            const FullChat=await chatModel.findOne({_id:createdchat._id}).populate("users","-password");
            res.status(200).send(FullChat);
     }
});

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = asyncHandler(async (req, res) => {
    let data=await chatModel.find({users:{$elemMatch:{$eq:req.user._id}}})
    .populate("users","-password").populate("groupAdmin","-password").populate("lastmessage").sort({updatedAt:-1})
    // chats from before lastmessage was saved
    await Promise.all(data.filter((chat)=>!chat.lastmessage).map(async (chat)=>{
      const latest=await messageModel.findOne({chat:chat._id}).sort({createdAt:-1,_id:-1});
      if(latest) chat.lastmessage=latest;
    }))
    data=await usermodel.populate(data,{
        path:"lastmessage.sender",
        select:"name email"
     })
  
    res.send(data);
});

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
const createGroupChat = asyncHandler(async (req, res) => {
 if(!req.body.users||typeof req.body.name!=="string"||!req.body.name.trim()){
   return res.status(400).send({message:"Please fill all the fields"})
 }
 let users;
 try {
   users=JSON.parse(req.body.users);
 } catch {
   users=null;
 }
 if(!Array.isArray(users)||!users.every(isValidId)){
   return res.status(400).send({message:"Invalid list of members"})
 }
 users=[...new Set(users.map((id)=>id.toLowerCase()))].filter((id)=>!req.user._id.equals(id));
 if(users.length<2){
   return res.status(400).send({message:"Pick at least 2 other people"})
 }
 if((await usermodel.countDocuments({_id:{$in:users}}))!==users.length){
   return res.status(400).send({message:"Some of those users do not exist"})
 }
 users.push(req.user)
   const groupChat=await chatModel.create({
      chatName:req.body.name,
      users:users,
      isGroupChat:true,
      groupAdmin:req.user,
   })
   const fullgroupChat= await chatModel.findOne({_id:groupChat._id})
   .populate("users","-password").populate("groupAdmin","-password");
   notifyMembers(req, fullgroupChat._id, fullgroupChat.users.map((user) => user._id));
   res.status(200).json(fullgroupChat)
  
});

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
const renameGroup = asyncHandler(async (req, res) => {
   const { chatId, chatName } = req.body;
   await getMemberGroup(req, res, chatId);
   if (typeof chatName !== "string" || !chatName.trim()) {
     res.status(400);
     throw new Error("Group name cannot be empty");
   }
   
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
     notifyMembers(req, updatedChat._id, updatedChat.users.map((user) => user._id));
     res.json(updatedChat);
   }
});

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  requireId(res, userId, "user id");
  const chat = await getMemberGroup(req, res, chatId);

  // anyone can leave, only the admin can remove somebody else
  if (!req.user._id.equals(userId) && !chat.groupAdmin?.equals(req.user._id)) {
    res.status(403);
    throw new Error("Only the group admin can do that");
  }

  const isAdminLeaving = !!chat.groupAdmin?.equals(userId);
  const io = req.app.get("io");

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

  io.in(userId.toLowerCase()).socketsLeave(String(chat._id));
  const isEmpty = updatedChat.users.length === 0;
  if (isEmpty) {
    await chatModel.findByIdAndDelete(chatId);
  } else if (isAdminLeaving) {
    updatedChat.groupAdmin = updatedChat.users[0];
    await updatedChat.save();
  }

  // only after saving, clients refetch as soon as they hear this.
  // the list from before the update, so the removed person is told as well
  notifyMembers(req, chat._id, chat.users);
  res.json(isEmpty ? { message: "Chat deleted as no users left" } : updatedChat);
});

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const addToGroup = asyncHandler(async (req, res) => {
   const { chatId, userId } = req.body;

  await getAdminGroup(req, res, chatId);
  requireId(res, userId, "user id");
  if (!(await usermodel.exists({ _id: userId }))) {
    res.status(404);
    throw new Error("User Not Found");
  }

  const added = await chatModel.findByIdAndUpdate(
    chatId,
    {
      $addToSet: { users: userId },
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
    notifyMembers(req, added._id, added.users.map((user) => user._id));
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