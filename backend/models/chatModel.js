//chatname
//isgroupchat
//users
//lastestMESSAGGE
//groupadmin

const mongoose=require('mongoose')


const chatSchema=mongoose.Schema({

    chatName:{type:String,trim:true},
    isGroupChat:{type:Boolean, default:false},
    users:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }],
    lastmessage:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"message"
    },
    groupAdmin:{type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }
},{
    timestamps:true
})
const chatModel=mongoose.model("chat",chatSchema);
module.exports=chatModel