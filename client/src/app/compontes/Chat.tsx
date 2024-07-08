
import React from 'react'

const Chat = async({chats}:{
    chats:any[]
}) => {

  return (
    <div>{
        chats.map((i)=>{
            return (
          <h1 key={i._id}>{i.chatName}</h1>
            )
        })}</div>
  )
}

export default Chat