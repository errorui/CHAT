import { avatarSrc } from '@/lib/avatar';
import { API_URL } from '@/lib/api';
import { useChat } from '@/context/ChatProvider';
import React, { useEffect, useRef, useState } from 'react';
import { getSender, isLastMessage, isSameSender } from '../utils/getContact';
import { Button } from '@/components/ui/button';
import Groupheader from './Groupheader';
import ProfileModal from './ProfileModal';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
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
  const [connections, setConnections] = useState(0);
  const typingIn = useRef<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();
  const [typingChat, setTypingChat] = useState<string | null>(null);
  const [loadingChats, setLoadingChats] = useState(true); // Add loading state for chats
  const { user, selectedChat, setSelectedChat, notification, setNotification,chats } = useChat();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
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
      setConnections((count) => count + 1);
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
    stopTyping();
    if (selectedChat) {
      setLoadingChats(true);
      fetchMessages();
      socket?.emit("joinchat", selectedChat._id);
    }
  }, [selectedChat?._id]);

  // catch up on whatever was sent while the socket was down
  useEffect(() => {
    if (connections < 2) return;
    fetchMessages();
    setFetchAgain((value: boolean) => !value);
  }, [connections]);

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
    if (event.key === "Enter" && !event.nativeEvent.isComposing && newMessage.trim()) {
      stopTyping();
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
        if (selectedChatcompare?._id === chatId) setNewMessage((current) => current || newMessage);
        toast({ variant: "destructive", title: "Message not sent", description: "Please try again." });
      }
    }
  };

  function stopTyping() {
    clearTimeout(typingTimer.current);
    if (typingIn.current) socket?.emit("stop typing", typingIn.current);
    typingIn.current = null;
  }

  const typingHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!socketConnected || !selectedChat) return;

    if (typingIn.current !== selectedChat._id) {
      typingIn.current = selectedChat._id;
      socket?.emit("typing", selectedChat._id);
    }

    // counts from the last key press
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 3000);
  };
  // not chats.find(): the first chat with this person is often the group itself
  const openDirectChat = async (userId: string) => {
    try {
      const { data } = await axios.post('/api/chat', { userId }, { withCredentials: true });
      setSelectedChat(data);
      setFetchAgain((value: boolean) => !value);
    } catch (error) {
      toast({ variant: "destructive", title: "Could not open the chat" });
    }
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
                const isSentByUser = message.sender?._id === user?._id;
                return (
                  <div key={index} className={`my-[1px] flex ${isSentByUser ? 'justify-end' : 'justify-start'}`}>
                    {shouldDisplaySender && message.sender && (
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
  openDirectChat(message.sender._id);
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
