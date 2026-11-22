"use client"
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useChat } from '@/context/ChatProvider';
import axios from 'axios';
import React, { useLayoutEffect, useState } from 'react'
import {Chat} from '../type'

import { getSender } from '../utils/getContact';
import MakeGroup from './MakeGroup';


const MyChats = () => {



  const {
    setSelectedChat,
    selectedChat,
    user,
    notification,
    setNotification,
    chats,
    setChats,
  } = useChat();
  const { toast } = useToast()
 
  return (
    <div className={`${selectedChat ? 'hidden' : 'flex-1'} overflow-y-scroll h-full min-w-0 shadow-lg p-3 `}>
      <div className='flex items-center justify-between w-full py-4  text-2xl shadow-md rounded-lg'>
        <h1>chats</h1>
    <MakeGroup></MakeGroup>
      </div>
      <div className="">
      <h1>contacts</h1>
      {chats&&chats.map((i:Chat)=>{
   
        return(
          <Card key={i._id} onClick={()=>{
            setSelectedChat(i)
          }}  className={`${i._id===selectedChat?._id?"bg-black text-white":""}  py-4 px-2 flex items-center hover:bg-slate-950 hover:text-white`}>
       
    
          <div>
            <h1 className="uppercase font-bold"></h1>
          {i.isGroupChat?i.chatName:getSender(user,i.users).name}
          </div>
        </Card>
        )
 
            
      })}
      </div>
     
    </div>
  )
}

export default MyChats