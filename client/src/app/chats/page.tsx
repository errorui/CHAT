"use client";

import React from "react";
import { useChat } from "@/context/ChatProvider";
import { cn } from "@/lib/utils";
import ChatBox from "../compontes/ChatBox";
import Header from "../compontes/Header";
import { Logo } from "../compontes/Logo";
import MyChats from "../compontes/MyChats";

const ChatsPage = () => {
  const { user, session, selectedChat } = useChat();

  if (!user) {
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <Logo className="animate-pulse text-2xl" />
        <p role="status" className="max-w-xs text-sm text-muted-foreground">
          {session === "unreachable"
            ? "Waking the server up. This can take up to a minute, and this page will carry on by itself."
            : "Loading your chats…"}
        </p>
      </main>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1">
        {/* phones show one pane at a time */}
        <aside
          className={cn(
            "w-full min-w-0 shrink-0 flex-col bg-card md:flex md:w-[21rem] md:border-r lg:w-[24rem]",
            selectedChat ? "hidden" : "flex"
          )}
        >
          <Header />
          <MyChats />
        </aside>
        <main className={cn("min-h-0 min-w-0 flex-1 flex-col md:flex", selectedChat ? "flex" : "hidden")}>
          <ChatBox />
        </main>
      </div>
    </div>
  );
};

export default ChatsPage;
