const mongoose=require('mongoose')
const messageSchema=mongoose.Schema({
   sender:{type:mongoose.Schema.Types.ObjectId,
    ref:"user"
   },
   content:{type:String,trim:true},
   chat:{type:mongoose.Schema.Types.ObjectId,ref:"chat"}
  
},{
    timestamps:true
})
// _id breaks ties, without it mongo reads and sorts the whole chat for every page
messageSchema.index({chat:1,createdAt:1,_id:1})
const messageModel=mongoose.model("message",messageSchema);
module.exports={messageModel}