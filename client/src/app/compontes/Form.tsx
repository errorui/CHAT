"use client";

import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  Card,
 
} from "@/components/ui/card";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./loginForm";
import SignupForm from "./SignupForm";
import { useChat } from "@/context/ChatProvider";
import { usePathname, useRouter } from "next/navigation";

const API_URL = 'https://chat-12-z8u3.onrender.com';
const ChatForm = () => {
  let{user}=useChat()
  const pathname = usePathname();
  const router = useRouter();

  useEffect(()=>{
    console.log('hi')
    if(user){
      router.push('/chats')
    }
  })
  
  return (
    <Tabs defaultValue="sign up" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-3">
        <TabsTrigger className="uppercase" value="sign up">
          sign up
        </TabsTrigger>
        <TabsTrigger className="uppercase" value="login">
          login
        </TabsTrigger>
      </TabsList>
      <TabsContent value="sign up">
      <SignupForm></SignupForm>
      </TabsContent>
      <TabsContent value="login">
        <Card className="p-5">
          <h1 className="text-3xl text-center p-3 uppercase">login</h1>
          <LoginForm />
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ChatForm;
