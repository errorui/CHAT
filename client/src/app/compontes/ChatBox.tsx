"use client";

import React, { useState } from "react";
import { LuMessagesSquare } from "react-icons/lu";
import { useToast } from "@/components/ui/use-toast";
import { useChat } from "@/context/ChatProvider";
import { useConversation } from "@/hooks/useConversation";
import { chatTitle, firstName } from "@/lib/chat";
import { Composer } from "./Composer";
import { ConversationHeader } from "./ConversationHeader";
import { MessageList } from "./MessageList";
import { Chat } from "../type";

const typingLabel = (chat: Chat, ids: string[]) => {
  if (!ids.length) return null;
  if (!chat.isGroupChat) return "typing…";

  const names = ids.flatMap((id) => {
    const member = chat.users.find((user) => user._id === id);
    return member ? [firstName(member.name)] : [];
  });
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return names.length ? "Several people are typing…" : "Someone is typing…";
};

const ChatBox = () => {
  const { user, selectedChat } = useChat();
  const { toast } = useToast();
  const chatId = selectedChat?._id;
  const { messages, history, retryHistory, hasOlder, older, loadOlder, pending, typingIds, notifyTyping, stopTyping, send } =
    useConversation(chatId);
  // one draft per chat, so text can never follow you into another conversation
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (!selectedChat || !chatId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-canvas px-8 text-center">
        <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-[38%] bg-accent text-accent-foreground">
          <LuMessagesSquare aria-hidden className="h-8 w-8" />
        </span>
        <h2 className="font-display text-2xl font-bold tracking-tight">Pick a conversation</h2>
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
          Choose a chat on the left, or start a new one with anyone on talk-tip.
        </p>
      </div>
    );
  }

  const draft = drafts[chatId] ?? "";
  const setDraft = (value: string) => setDrafts((all) => ({ ...all, [chatId]: value }));

  const change = (value: string) => {
    setDraft(value);
    if (value.trim()) notifyTyping();
    else stopTyping();
  };

  const submit = async () => {
    const text = draft;
    setDraft("");
    if (await send(text)) return;
    // back into the chat it was written in, unless something newer was typed there
    setDrafts((all) => ({ ...all, [chatId]: all[chatId] || text }));
    toast({ variant: "destructive", title: "Message not sent", description: "Your text is back in the message box." });
  };

  const typing = typingLabel(selectedChat, typingIds);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ConversationHeader chat={selectedChat} typing={typing} />
      <MessageList
        key={chatId}
        chat={selectedChat}
        messages={messages}
        pending={pending}
        history={history}
        onRetry={retryHistory}
        hasOlder={hasOlder}
        older={older}
        onLoadOlder={loadOlder}
        typing={typing}
      />
      <Composer
        chatId={chatId}
        recipient={chatTitle(user, selectedChat)}
        value={draft}
        onChange={change}
        onSend={submit}
      />
    </div>
  );
};

export default ChatBox;
