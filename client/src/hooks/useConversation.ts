"use client";

import axios from "axios";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@/context/ChatProvider";
import { relayMessage } from "@/lib/previousApi";
import type { Message, PendingMessage } from "@/app/type";

type HistoryState = "loading" | "ready" | "error";

const STOP_TYPING_AFTER = 3000; // since the last key press
const REPEAT_TYPING_EVERY = 2000;
const FORGET_TYPING_AFTER = 5000; // in case a "stop typing" never arrives

// a sent message arrives twice: in the http response and over the socket
const appendMessage = (list: Message[], message: Message) =>
  list.some((item) => item._id === message._id) ? list : [...list, message];

let pendingCount = 0;

export function useConversation(chatId?: string) {
  const { socket, user, showInList } = useChat();
  const myId = user?._id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<HistoryState>("loading");
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [typingIds, setTypingIds] = useState<string[]>([]);

  const activeChat = useRef<string | undefined>(undefined);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const typingSentAt = useRef(0);

  const loadHistory = useCallback(async () => {
    if (!chatId) return;
    try {
      const { data } = await axios.get<Message[]>(`/api/message/${chatId}`);
      // another chat was opened while this one was loading
      if (activeChat.current !== chatId) return;
      // keep anything that arrived over the socket meanwhile
      setMessages((arrived) => arrived.reduce(appendMessage, data));
      setHistory("ready");
    } catch {
      if (activeChat.current === chatId) setHistory((state) => (state === "ready" ? state : "error"));
    }
  }, [chatId]);

  // before paint, so one chat's messages never appear under another chat's name
  useLayoutEffect(() => {
    activeChat.current = chatId;
    setMessages([]);
    setTypingIds([]);
    setHistory("loading");
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
        relayMessage(socket, data);
        return true;
      } catch {
        return false;
      } finally {
        setPending((list) => list.filter((item) => item.id !== id));
      }
    },
    [chatId, socket, stopTyping, showInList]
  );

  // a stable array, so the message list can skip rendering while you type
  const pendingHere = useMemo(() => pending.filter((item) => item.chatId === chatId), [pending, chatId]);

  return {
    messages,
    history,
    retryHistory,
    pending: pendingHere,
    typingIds,
    notifyTyping,
    stopTyping,
    send,
  };
}
