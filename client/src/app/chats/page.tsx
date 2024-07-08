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

const API_URL = 'http://localhost:5000';
const page = () => {
  let {user}=useChat()
  const [fetchAgain, setFetchAgain] = useState(false);
  return (
    <div className='w-full h-[100vh]'>
      {user&&<Header></Header>}
     <Card className='  p-5 flex justify-between w-full '>
      {user &&<MyChats fetchAgain={fetchAgain}></MyChats>}
      {user &&<ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain}></ChatBox>}

     </Card>
    </div>
  )
}

export default page