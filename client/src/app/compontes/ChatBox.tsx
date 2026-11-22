import { avatarSrc } from '@/lib/avatar';
import { API_URL } from '@/lib/api';
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
let socket: Socket<DefaultEventsMap, DefaultEventsMap> | null = null;
let selectedChatcompare: Chat | undefined;


// a sent message arrives twice: in the http response and over the socket
const appendMessage = (list: Message[], message: Message) =>
  list.some((item) => item._id === message._id) ? list : [...list, message];

const ChatBox = ({ fetchAgain, setFetchAgain }: { fetchAgain: any, setFetchAgain: any }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typingChat, setTypingChat] = useState<string | null>(null);
  const [loadingChats, setLoadingChats] = useState(true); // Add loading state for chats
  const { user, selectedChat, setSelectedChat, notification, setNotification,chats } = useChat();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Real-time connection socket logic
  useEffect(() => {
    if (!user) return;

    socket = io(API_URL, {
      // the login cookie belongs to this site, so fetch a short lived ticket for the socket
      auth: (done) => {
        axios.get('/api/user/socket-token').then(({ data }) => done(data)).catch(() => done({}));
      },
    });
    const connection = socket;
    let retry: ReturnType<typeof setTimeout>;
    socket.on('connect', () => {
      setSocketConnected(true);
      // rooms are forgotten on every reconnect
      if (selectedChatcompare) connection.emit("joinchat", selectedChatcompare._id);
    });
    socket.on('connect_error', () => {
      // socket.io doesn't retry by itself when the server refuses the connection
      if (!connection.active) retry = setTimeout(() => connection.connect(), 5000);
    });

    socket.on("typing", ({ chatId }: { chatId: string }) => {
      setTypingChat(chatId);
    });

    socket.on("stop typing", ({ chatId }: { chatId: string }) => {
      setTypingChat((current) => (current === chatId ? null : current));
    });

    socket.on("chats changed", () => {
      setFetchAgain((value: boolean) => !value);
    });

    socket.on("message received", (newMessageReceived) => {
      if (!selectedChatcompare || selectedChatcompare._id !== newMessageReceived.chat._id) {
        // the sender's other tabs get the message too, but don't need a notification
        if (newMessageReceived.sender?._id !== user._id) {
          setNotification((prevNotifications) => [...prevNotifications, newMessageReceived]);
        }
        setFetchAgain((value: boolean) => !value);
        return;
      };
      setMessages((prevMessages) => appendMessage(prevMessages, newMessageReceived));
    });

    return () => {
      clearTimeout(retry);
      connection.disconnect();
    };
  }, [user?._id]);

  useEffect(() => {
    selectedChatcompare = selectedChat;
    setMessages([]);
    setNewMessage("");
    if (selectedChat) {
      setLoadingChats(true);
      fetchMessages();
      socket?.emit("joinchat", selectedChat._id);
    }
  }, [selectedChat?._id]);

  const fetchMessages = async () => {
    if (!selectedChat) return;
    const chatId = selectedChat._id;

    try {
      setLoading(true);
      const { data } = await axios.get(`/api/message/${chatId}`, { withCredentials: true });
      // another chat was opened while this one was loading
      if (selectedChatcompare?._id !== chatId) return;
      // keep anything that arrived over the socket meanwhile
      setMessages((arrived) => arrived.reduce(appendMessage, data as Message[]));
      setLoading(false);
      setLoadingChats(false); // Set loadingChats to false after fetching messages
    } catch (error) {
      if (selectedChatcompare?._id !== chatId) return;
      console.log(error);
      alert("Error fetching messages");
      setLoadingChats(false); // Set loadingChats to false in case of error
    }
  };

  const sendMessage = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && newMessage) {
      socket?.emit("stop typing", selectedChat?._id);
      setTyping(false);
      const chatId = selectedChat?._id;
      try {
        setNewMessage("");
        const { data } = await axios.post(`/api/message`, {
          content: newMessage,
          chatId,
        }, {
          withCredentials: true,
        });
        if (selectedChatcompare?._id === chatId) {
          setMessages((prevMessages) => appendMessage(prevMessages, data));
        }
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
              {typingChat !== null && typingChat === selectedChat?._id && <h1 className='text-3xl'>Typing...</h1>}
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
