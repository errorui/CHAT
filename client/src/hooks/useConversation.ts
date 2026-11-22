"use client";

import axios from "axios";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@/context/ChatProvider";

import type { Message, PendingMessage } from "@/app/type";

type HistoryState = "loading" | "ready" | "error";
export type OlderState = "idle" | "loading" | "error";

const PAGE_SIZE = 50;
const STOP_TYPING_AFTER = 3000; // since the last key press
const REPEAT_TYPING_EVERY = 2000;
const FORGET_TYPING_AFTER = 5000; // in case a "stop typing" never arrives

// a sent message arrives twice: in the http response and over the socket
const appendMessage = (list: Message[], message: Message) =>
  list.some((item) => item._id === message._id) ? list : [...list, message];

// createdAt is always an ISO string, so it sorts as text
const byTime = (a: Message, b: Message) => {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return a._id < b._id ? -1 : a._id > b._id ? 1 : 0;
};

const mergeMessages = (...lists: Message[][]) =>
  Array.from(new Map(lists.flat().map((message) => [message._id, message])).values()).sort(byTime);

let pendingCount = 0;

export function useConversation(chatId?: string) {
  const { socket, user, showInList } = useChat();
  const myId = user?._id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<HistoryState>("loading");
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [typingIds, setTypingIds] = useState<string[]>([]);
  const [hasOlder, setHasOlder] = useState(false);
  const [older, setOlder] = useState<OlderState>("idle");

  // what is on screen, for responses that come back later
  const shown = useRef<Message[]>([]);
  const loadingOlder = useRef(false);
  useLayoutEffect(() => {
    shown.current = messages;
  }, [messages]);

  const activeChat = useRef<string | undefined>(undefined);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const typingSentAt = useRef(0);

  const loadHistory = useCallback(async () => {
    if (!chatId) return;
    try {
      const { data } = await axios.get<Message[]>(`/api/message/${chatId}`, { params: { limit: PAGE_SIZE } });
      // another chat was opened while this one was loading
      if (activeChat.current !== chatId) return;

      const fullPage = data.length === PAGE_SIZE;
      // a full page with nothing we already had: there may be messages missing in between
      const gap = fullPage && !shown.current.some((message) => message._id === data[0]._id);

      // keep anything that arrived over the socket meanwhile, but nothing from before a gap
      setMessages((current) =>
        mergeMessages(gap ? current.filter((message) => byTime(message, data[0]) > 0) : current, data)
      );
      if (!fullPage) setHasOlder(false);
      else if (gap) setHasOlder(true);
      setHistory("ready");
    } catch {
      if (activeChat.current === chatId) setHistory((state) => (state === "ready" ? state : "error"));
    }
  }, [chatId]);

  const loadOlder = useCallback(async () => {
    const oldest = shown.current[0];
    if (!chatId || !oldest || loadingOlder.current) return;

    loadingOlder.current = true;
    setOlder("loading");
    try {
      const { data } = await axios.get<Message[]>(`/api/message/${chatId}`, {
        params: { limit: PAGE_SIZE, before: oldest._id },
      });
      if (activeChat.current !== chatId) return;
      // the list restarted after a gap meanwhile, so this page no longer joins up
      if (shown.current[0]?._id === oldest._id) {
        const addsSomething = data.some((message) => !shown.current.some((item) => item._id === message._id));
        setMessages((current) => mergeMessages(data, current));
        if (data.length < PAGE_SIZE || !addsSomething) setHasOlder(false);
      }
      setOlder("idle");
    } catch {
      if (activeChat.current === chatId) setOlder("error");
    } finally {
      if (activeChat.current === chatId) loadingOlder.current = false;
    }
  }, [chatId]);

  // before paint, so one chat's messages never appear under another chat's name
  useLayoutEffect(() => {
    activeChat.current = chatId;
    setMessages([]);
    setTypingIds([]);
    setHistory("loading");
    shown.current = [];
    loadingOlder.current = false;
    setHasOlder(false);
    setOlder("idle");
    void loadHistory();
    return () => {
      activeChat.current = undefined;
    };
  }, [chatId, loadHistory]);

  const retryHistory = useCallback(() => {
    setHistory("loading");
    void loadHistory();
  }, [loadHistory]);

  const stopTyping = useCallback(() => {
    clearTimeout(typingTimer.current);
    if (typingSentAt.current && chatId) socket?.emit("stop typing", chatId);
    typingSentAt.current = 0;
  }, [socket, chatId]);

  useEffect(() => {
    if (!socket || !chatId) return;
    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    const forget = (id: string) => {
      clearTimeout(timers.get(id));
      timers.delete(id);
      setTypingIds((list) => list.filter((item) => item !== id));
    };
    const join = () => socket.emit("joinchat", chatId);
    const onConnect = () => {
      // rooms are forgotten on every reconnect, and messages may have been missed
      join();
      void loadHistory();
    };
    const onTyping = (event?: { chatId?: string; userId?: string }) => {
      // older api builds send no payload
      if (event?.chatId !== chatId || event?.userId === myId) return;
      const id = event?.userId ?? "";
      clearTimeout(timers.get(id));
      timers.set(id, setTimeout(() => forget(id), FORGET_TYPING_AFTER));
      setTypingIds((list) => (list.includes(id) ? list : [...list, id]));
    };
    const onStopTyping = (event?: { chatId?: string; userId?: string }) => {
      if (event?.chatId === chatId) forget(event?.userId ?? "");
    };
    const onMessage = (message: Message) => {
      if (message.chat._id !== chatId) return;
      setMessages((list) => appendMessage(list, message));

      const senderId = message.sender?._id;
      if (senderId) forget(senderId);
      if (senderId === myId) {
        // the real one is here, so drop its placeholder
        setPending((list) => {
          const index = list.findIndex((item) => item.chatId === chatId && item.content === message.content);
          return index < 0 ? list : list.filter((_, position) => position !== index);
        });
      }
    };

    if (socket.connected) join();
    socket.on("connect", onConnect);
    socket.on("typing", onTyping);
    socket.on("stop typing", onStopTyping);
    socket.on("message received", onMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("typing", onTyping);
      socket.off("stop typing", onStopTyping);
      socket.off("message received", onMessage);
      timers.forEach(clearTimeout);
      setTypingIds([]);
    };
  }, [socket, chatId, myId, loadHistory]);

  // leaving the chat also means we stopped typing in it
  useEffect(() => stopTyping, [stopTyping]);

  const notifyTyping = useCallback(() => {
    if (!socket?.connected || !chatId) return;
    const now = Date.now();
    if (now - typingSentAt.current > REPEAT_TYPING_EVERY) {
      socket.emit("typing", chatId);
      typingSentAt.current = now;
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, STOP_TYPING_AFTER);
  }, [socket, chatId, stopTyping]);

  /** Resolves to false when the message could not be sent. */
  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!chatId || !content) return true;

      stopTyping();
      const id = `pending-${++pendingCount}`;
      setPending((list) => [...list, { id, chatId, content }]);
      try {
        const { data } = await axios.post<Message>("/api/message", { content, chatId });
        if (activeChat.current === chatId) setMessages((list) => appendMessage(list, data));
        showInList(data);
        return true;
      } catch {
        return false;
      } finally {
        setPending((list) => list.filter((item) => item.id !== id));
      }
    },
    [chatId, stopTyping, showInList]
  );

  // a stable array, so the message list can skip rendering while you type
  const pendingHere = useMemo(() => pending.filter((item) => item.chatId === chatId), [pending, chatId]);

  return {
    messages,
    history,
    retryHistory,
    hasOlder,
    older,
    loadOlder,
    pending: pendingHere,
    typingIds,
    notifyTyping,
    stopTyping,
    send,
  };
}
