import { avatarSrc } from '@/lib/avatar';
import { useConversation } from '@/hooks/useConversation';
import { useChat } from '@/context/ChatProvider';
import React, { useEffect, useRef, useState } from 'react';
import { getSender, isLastMessage, isSameSender } from '../utils/getContact';
import { Button } from '@/components/ui/button';
import Groupheader from './Groupheader';
import ProfileModal from './ProfileModal';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Message } from '../type';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
const ChatBox = () => {
  const { user, selectedChat, setSelectedChat, openDirectChat: openChat } = useChat();
  const { messages, history, typingIds, notifyTyping, send } = useConversation(selectedChat?._id);
  const [newMessage, setNewMessage] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const openId = useRef<string | undefined>(undefined);
  const { toast } = useToast();
  const loadingChats = history === "loading";

  useEffect(() => {
    openId.current = selectedChat?._id;
    setNewMessage("");
  }, [selectedChat?._id]);

  useEffect(() => {
    const list = scroller.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, history]);

  const sendMessage = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.nativeEvent.isComposing && newMessage.trim()) {
      const chatId = selectedChat?._id;
      const text = newMessage;
      setNewMessage("");
      if (await send(text)) return;
      if (openId.current === chatId) setNewMessage((current) => current || text);
      toast({ variant: "destructive", title: "Message not sent", description: "Please try again." });
    }
  };

  const typingHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    notifyTyping();
  };

  const openDirectChat = async (userId: string) => {
    try {
      await openChat(userId);
    } catch (error) {
      toast({ variant: "destructive", title: "Could not open the chat" });
    }
  };

  return (
    <div className={`${selectedChat ? 'flex' : 'hidden'} h-full min-w-0 flex-1 flex-col rounded-lg shadow-md bg-slate-200`}>
      <div className="bg-white p-3 w-full flex shadow-lg items-center">
        <Button onClick={() => { setSelectedChat(undefined) }}>Back</Button>
        {selectedChat && selectedChat.isGroupChat ? (
          <div className='flex-1'>
            <Groupheader group={selectedChat}></Groupheader>
          </div>
        ) : (
          <div>
            {selectedChat && <ProfileModal user={getSender(user, selectedChat.users)}></ProfileModal>}
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 flex flex-col justify-between bg-slate-100">
        {loadingChats ? ( // Conditional rendering based on loadingChats state
          <div className="flex justify-center items-center h-full">
            <span>Loading chats...</span>
          </div>
        ) : (
          <>
            <div ref={scroller} className="p-5 min-h-0 flex-1 overflow-y-scroll flex flex-col">
              {messages && messages.map((message: Message, index) => {
                const shouldDisplaySender = isSameSender(messages, message, index, user?._id) || isLastMessage(messages, index, user?._id);
                const isSentByUser = message.sender?._id === user?._id;
                return (
                  <div key={message._id} className={`my-[1px] flex ${isSentByUser ? 'justify-end' : 'justify-start'}`}>
                    {shouldDisplaySender && message.sender && (
                    <Dialog  >
                    <DialogTrigger asChild>
                      <Avatar>
                        <AvatarImage src={avatarSrc(message.sender)} alt="@shadcn" />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                    </DialogTrigger>
                    <DialogContent  className="flex flex-col items-center justify-center">
                      <DialogHeader>
                        <DialogDescription>
                    Profile pic
<Avatar className="size-[200px]"><AvatarImage src={avatarSrc(message.sender)} alt="" /><AvatarFallback>{message.sender.name.slice(0, 3)}</AvatarFallback></Avatar>
 <br></br>
 email:{message.sender.email}
      </DialogDescription>
    </DialogHeader>
    <Button onClick={() => {
  openDirectChat(message.sender._id);
}}>Talk</Button>

 
  </DialogContent>
                  </Dialog>
                    )}
                    <span className={`${isSentByUser ? "bg-white text-black" : "bg-black text-white"} p-3 shadow-lg rounded-lg max-w-xs min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]`}>
                      {message.content}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="">
              {typingIds.length > 0 && <h1 className='text-3xl'>Typing...</h1>}
            </div>
            <div className="flex">
              <Input placeholder='Enter your message' value={newMessage} onKeyDown={sendMessage} onChange={typingHandler} className="border-2 border-black"></Input>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatBox;
