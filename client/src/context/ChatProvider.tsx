"use client";

import axios from "axios";
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { API_URL } from "@/lib/api";

import { User, Chat, Message } from "../app/type";

type SessionState = "loading" | "unreachable" | "signed-in" | "signed-out";
type ListState = "loading" | "ready" | "error";
type ConnectionState = "connecting" | "online" | "offline";

type ContextType = {
  user: User | null;
  session: SessionState;
  signOut: () => Promise<void>;
  sessionChanged: () => void;
  updateUser: (changes: User) => void;
  selectedChat: Chat | undefined;
  setSelectedChat: React.Dispatch<React.SetStateAction<Chat | undefined>>;
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  chatsState: ListState;
  refreshChats: () => Promise<void>;
  openDirectChat: (userId: string) => Promise<void>;
  showInList: (message: Message) => void;
  notification: Message[];
  setNotification: React.Dispatch<React.SetStateAction<Message[]>>;
  socket: Socket | null;
  connection: ConnectionState;
};

const ChatContext = createContext<ContextType | undefined>(undefined);

const fetchSessionUser = async () => {
  try {
    const { data } = await axios.get<User>("/api/user/user");
    return data;
  } catch (error) {
    // only a 401 means signed out, anything else is a temporary failure
    return axios.isAxiosError(error) && error.response?.status === 401 ? null : undefined;
  }
};

const ChatProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SessionState>("loading");
  const [selectedChat, setSelectedChat] = useState<Chat | undefined>(undefined);
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsState, setChatsState] = useState<ListState>("loading");
  const [notification, setNotification] = useState<Message[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");

  // the socket handlers outlive renders, so they read these instead of state
  const openChatId = useRef<string | undefined>(undefined);
  const knownChats = useRef<Chat[]>([]);
  const listRequest = useRef(0);
  const listLoading = useRef(false);

  const userId = user?._id;
  const selectedId = selectedChat?._id;

  useEffect(() => {
    knownChats.current = chats;
  }, [chats]);

  // nothing of one account may survive into the next one on the same browser
  const clearSession = useCallback(() => {
    listRequest.current += 1; // drops a list response that is still on its way
    listLoading.current = false;
    setUser(null);
    setSelectedChat(undefined);
    setChats([]);
    setChatsState("loading");
    setNotification([]);
  }, []);

  const refreshChats = useCallback(async () => {
    const request = ++listRequest.current;
    const known = new Set(knownChats.current.map((chat) => chat._id));
    listLoading.current = true;
    try {
      const { data } = await axios.get<Chat[]>("/api/chat");
      if (request !== listRequest.current) return;
      setChats(data);
      setChatsState("ready");
      // nothing left to open for a chat we were removed from
      setNotification((list) =>
        list.filter((item) => !known.has(item.chat._id) || data.some((chat) => chat._id === item.chat._id))
      );
      // update the open chat, or close it if we were removed from it
      setSelectedChat(
        (open) => open && (data.find((chat) => chat._id === open._id) ?? (known.has(open._id) ? undefined : open))
      );
    } catch {
      if (request === listRequest.current) setChatsState((state) => (state === "ready" ? state : "error"));
    } finally {
      if (request === listRequest.current) listLoading.current = false;
    }
  }, []);

  const updateUser = useCallback((changes: User) => {
    setUser((current) => (current?._id === changes._id ? { ...current, ...changes } : current));
  }, []);

  const showInList = useCallback((message: Message) => {
    const chatId = message.chat._id;
    setChats((list) => {
      const chat = list.find((item) => item._id === chatId);
      if (!chat) return list;
      const updated = { ...chat, lastmessage: message, updatedAt: message.createdAt };
      return [updated, ...list.filter((item) => item._id !== chatId)];
    });
  }, []);

  const openDirectChat = useCallback(
    async (otherId: string) => {
      const { data } = await axios.post<Chat>("/api/chat", { userId: otherId });
      setChats((list) => (list.some((chat) => chat._id === data._id) ? list : [data, ...list]));
      setSelectedChat(data);
      void refreshChats();
    },
    [refreshChats]
  );

  // the cookie is shared by every tab, so the others have to follow
  const tabs = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel("talk-tip-session");
    channel.onmessage = () => window.location.reload();
    tabs.current = channel;
    return () => {
      channel.close();
      tabs.current = null;
    };
  }, []);
  const sessionChanged = useCallback(() => tabs.current?.postMessage("changed"), []);

  const signOut = useCallback(async () => {
    await axios.get("/api/user/logout");
    sessionChanged();
    clearSession();
    setSession("signed-out");
    router.replace("/");
  }, [clearSession, router, sessionChanged]);

  // the login expired while the app was open
  useEffect(() => {
    if (!userId) return;
    const id = axios.interceptors.response.use(undefined, (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401 && error.config?.url !== "/api/user/login") {
        clearSession();
        setSession("signed-out");
        router.replace("/");
      }
      return Promise.reject(error);
    });
    return () => axios.interceptors.response.eject(id);
  }, [userId, clearSession, router]);

  // who is signed in
  useEffect(() => {
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout>;

    const check = async () => {
      const result = await fetchSessionUser();
      if (cancelled) return;
      if (result === undefined) {
        setSession((state) => (state === "signed-in" ? state : "unreachable"));
        retry = setTimeout(check, 3000);
      } else if (result === null) {
        clearSession();
        setSession("signed-out");
        if (pathname !== "/") router.replace("/");
      } else {
        setUser(result);
        setSession("signed-in");
      }
    };

    void check();
    return () => {
      cancelled = true;
      clearTimeout(retry);
    };
  }, [pathname, clearSession, router]);

  useEffect(() => {
    if (userId) void refreshChats();
  }, [userId, refreshChats]);

  useEffect(() => {
    openChatId.current = selectedId;
    if (selectedId) setNotification((list) => list.filter((item) => item.chat._id !== selectedId));
  }, [selectedId]);

  // one realtime connection per signed in account
  useEffect(() => {
    if (!userId) return;

    const client = io(API_URL, {
      // the login cookie belongs to this site, so fetch a short lived ticket for the socket
      auth: (done) => {
        axios.get("/api/user/socket-token").then(({ data }) => done(data)).catch(() => done({}));
      },
    });
    let retry: ReturnType<typeof setTimeout>;
    let connectedBefore = false;

    client.on("connect", () => {
      setConnection("online");
      // catch up on whatever happened while the socket was down
      if (connectedBefore) void refreshChats();
      connectedBefore = true;
    });
    client.on("disconnect", (reason) => {
      setConnection("offline");
      // the server does this after a password change, and then socket.io waits for us to reconnect
      if (reason === "io server disconnect") retry = setTimeout(() => client.connect(), 500);
    });
    client.on("connect_error", () => {
      setConnection("offline");
      // socket.io doesn't retry by itself when the server refuses the connection
      if (!client.active) retry = setTimeout(() => client.connect(), 5000);
    });

    client.on("chats changed", () => void refreshChats());
    // someone we share a chat with, or ourselves in another tab
    client.on("profile changed", (changed: User) => {
      updateUser(changed);
      void refreshChats();
    });

    client.on("message received", (message: Message) => {
      const chatId = message.chat._id;
      showInList(message);
      // a chat we don't have yet, or a list response that predates this message
      if (listLoading.current || !knownChats.current.some((chat) => chat._id === chatId)) void refreshChats();

      // the sender's other tabs get the message too, but don't need a notification
      if (message.sender?._id !== userId && openChatId.current !== chatId) {
        setNotification((list) => (list.some((item) => item._id === message._id) ? list : [...list, message]));
      }
    });

    setSocket(client);
    return () => {
      clearTimeout(retry);
      client.removeAllListeners();
      client.disconnect();
      setSocket(null);
      setConnection("connecting");
    };
  }, [userId, refreshChats, showInList, updateUser]);

  return (
    <ChatContext.Provider
      value={{
        user,
        session,
        signOut,
        sessionChanged,
        updateUser,
        selectedChat,
        setSelectedChat,
        chats,
        setChats,
        chatsState,
        refreshChats,
        openDirectChat,
        showInList,
        notification,
        setNotification,
        socket,
        connection,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export { ChatProvider, useChat };
