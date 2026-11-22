"use client";

import axios from "axios";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, Chat, Message } from '../app/type';


type ContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  selectedChat: Chat | undefined;
  setSelectedChat: React.Dispatch<React.SetStateAction<Chat | undefined>>;
  chats: Chat[];
  setChats:  React.Dispatch<React.SetStateAction<Chat[]>>;
  notification: Message[];
  setNotification: React.Dispatch<React.SetStateAction<Message[]>>;
};

const ChatContext = createContext<ContextType | undefined>(undefined);

const ChatProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [selectedChat, setSelectedChat] = useState<Chat | undefined>(undefined);
  const [notification, setNotification] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const router = useRouter();

  const getUser = async () => {
    try {
      const response = await axios.get(`/api/user/user`, {
        withCredentials: true,
      });
      return response.data as User;
    } catch (error) {
      // only a 401 means signed out, anything else is a temporary failure
      return axios.isAxiosError(error) && error.response?.status === 401 ? null : undefined;
    }
  };

  useEffect(() => {
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout>;
    const fetchUser = async () => {
      const res = await getUser();
      if (cancelled) return;
      if (res === undefined) {
        retry = setTimeout(fetchUser, 3000);
        return;
      }
      if (!res) {

        router.push('/');
      } else {

        setUser(res);
      }
    };

    fetchUser();
    return () => {
      cancelled = true;
      clearTimeout(retry);
    };
  }, [pathname]);

  return (
    <ChatContext.Provider value={{
      selectedChat,
      setSelectedChat,
      user,
      setUser,
      notification,
      setNotification,
      chats,
      setChats,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

const useChat = () => {
  let context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export { ChatProvider, useChat };
