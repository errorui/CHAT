import { useChat } from '@/context/ChatProvider';
import React, { useEffect, useState } from 'react';
import { getSender, isLastMessage, isSameSender } from '../utils/getContact';
import { Button } from '@/components/ui/button';
import Groupheader from './Groupheader';
import ProfileModal from './ProfileModal';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import io, { Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { Chat, Message, User } from '../type';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
const EndPoint = 'http://localhost:5000';
let socket: Socket<DefaultEventsMap, DefaultEventsMap> | null = null;
let selectedChatcompare: Chat;

const API_URL = 'http://localhost:5000';

const ChatBox = ({ fetchAgain, setFetchAgain }: { fetchAgain: any, setFetchAgain: any }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true); // Add loading state for chats
  const { user, selectedChat, setSelectedChat, notification, setNotification,chats } = useChat();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Real-time connection socket logic
  useEffect(() => {
    if (!user) return;

    socket = io(EndPoint);
    socket.emit("setup", user);
    socket.on('connected', () => {
      setSocketConnected(true);
    });

    socket.on("typing", () => {
      setIsTyping(true);
    });

    socket.on("stop typing", () => {
      setIsTyping(false);
    });

    socket.on("message received", (newMessageReceived) => {
      if (!selectedChatcompare || selectedChatcompare._id !== newMessageReceived.chat._id) {
        setNotification((prevNotifications) => [...prevNotifications, newMessageReceived]);
        setFetchAgain(!fetchAgain);
        return;
      };
      setMessages((prevMessages) => [...prevMessages, newMessageReceived]);
    });

    return () => {
      socket?.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      selectedChatcompare = selectedChat;
      socket?.emit("joinchat", selectedChat._id);
    }
  }, [selectedChat]);

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/api/message/${selectedChat._id}`, { withCredentials: true });
      setMessages(data);
      setLoading(false);
      setLoadingChats(false); // Set loadingChats to false after fetching messages
    } catch (error) {
      console.log(error);
      alert("Error fetching messages");
      setLoadingChats(false); // Set loadingChats to false in case of error
    }
  };

  const sendMessage = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && newMessage) {
      socket?.emit("stop typing", selectedChat?._id);
      setTyping(false);
      try {
        setNewMessage("");
        const { data } = await axios.post(`${API_URL}/api/message`, {
          content: newMessage,
          chatId: selectedChat?._id,
        }, {
          withCredentials: true,
        });
        setMessages((prevMessages) => [...prevMessages, data]);
        socket?.emit("message", data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const typingHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket?.emit("typing", selectedChat?._id);
    }

    const lastTypingTime = new Date().getTime();
    const typingTimeout = 3000;

    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= typingTimeout && typing) {
        socket?.emit("stop typing", selectedChat?._id);
        setTyping(false);
      }
    }, typingTimeout);
  };
  const handleAvatarClick = (user: User) => {
 
    setIsDialogOpen(true);
  };

  const handleTalkButtonClick = () => {

   
      setIsDialogOpen(false); 

  };
  const getImageSrc = (user: any) => {
    const mimeType = "image/jpeg";
    return `data:${mimeType};base64,${user.ProfilePic}`;
  };

  return (
    <div className={`${selectedChat ? 'flex-1' : 'hidden'} h-full rounded-lg shadow-md bg-slate-200`}>
      <div className="bg-white p-3 w-full flex shadow-lg items-center">
        <Button onClick={() => { setSelectedChat(undefined) }}>Back</Button>
        {selectedChat && selectedChat.isGroupChat ? (
          <div className='flex-1'>
            <Groupheader fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} group={selectedChat}></Groupheader>
          </div>
        ) : (
          <div>
            {selectedChat && <ProfileModal user={getSender(user, selectedChat.users)}></ProfileModal>}
          </div>
        )}
      </div>
      <div className="h-[90vh] flex flex-col justify-between bg-slate-100">
        {loadingChats ? ( // Conditional rendering based on loadingChats state
          <div className="flex justify-center items-center h-full">
            <span>Loading chats...</span>
          </div>
        ) : (
          <>
            <div className="p-5 h-[100%] overflow-y-scroll flex flex-col">
              {messages && messages.map((message: Message, index) => {
                const shouldDisplaySender = isSameSender(messages, message, index, user?._id) || isLastMessage(messages, index, user?._id);
                const isSentByUser = message.sender._id === user?._id;
                return (
                  <div key={index} className={`my-[1px] flex ${isSentByUser ? 'justify-end' : 'justify-start'}`}>
                    {shouldDisplaySender && (
                    <Dialog  >
                    <DialogTrigger asChild>
                      <Avatar onClick={() => handleAvatarClick(message.sender)}>
                        <AvatarImage src={getImageSrc(message.sender)} alt="@shadcn" />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                    </DialogTrigger>
                    <DialogContent  className="flex flex-col items-center justify-center">
                      <DialogHeader>
                        <DialogDescription>
                    Profile pic
<div className="  object-fill overflow-hidden rounded-full size-[200px] "><img src={message.sender.ProfilePic?getImageSrc(message.sender):"https://github.com/shadcn.png"} className="object-fill  w-full h-full bg-center" alt="" /></div>
 <br></br>
 email:{message.sender.email}
      </DialogDescription>
    </DialogHeader>
    <Button onClick={() => {
  if (message.sender && chats.length > 0) {
  
    const similarChat = chats.find(chat =>
      chat.users.some(user =>
        user.email.toLowerCase() === message.sender.email.toLowerCase()
      )
    );

    if (similarChat) {
      setSelectedChat(similarChat); 
    } else {
      alert("No chat found with the user in current chats");
    }
  }
}}>Talk</Button>

 
  </DialogContent>
                  </Dialog>
                    )}
                    <span className={`${isSentByUser ? "bg-white text-black" : "bg-black text-white"} p-3 shadow-lg rounded-lg max-w-xs`}>
                      {message.content}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="">
              {istyping && <h1 className='text-3xl'>Typing...</h1>}
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
