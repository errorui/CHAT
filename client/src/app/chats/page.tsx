"use client"
import React, { useState } from 'react'
import Chat from '../compontes/Chat'

import axios from "axios";
import { useChat } from '@/context/ChatProvider';
import { Card } from '@/components/ui/card';
import { Drawer } from '../compontes/Drawer';
import MyChats from '../compontes/MyChats';
import ChatBox from '../compontes/ChatBox';
import Header from '../compontes/Header';

const page = () => {
  let {user}=useChat()
  const [fetchAgain, setFetchAgain] = useState(0);
  return (
    <div className='flex h-dvh w-full flex-col overflow-hidden'>
      {user&&<Header></Header>}
     <Card className='flex min-h-0 w-full flex-1 p-2 sm:p-5'>
      {user &&<MyChats fetchAgain={fetchAgain}></MyChats>}
      {user &&<ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain}></ChatBox>}

     </Card>
    </div>
  )
}

export default page