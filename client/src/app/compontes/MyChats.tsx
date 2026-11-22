"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/context/ChatProvider";
import { chatTitle, firstName } from "@/lib/chat";
import { formatListTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getSender } from "../utils/getContact";
import { Drawer } from "./Drawer";
import MakeGroup from "./MakeGroup";
import { SearchField } from "./SearchField";
import { GroupAvatar, UserAvatar } from "./UserAvatar";
import { Chat, User } from "../type";

const preview = (me: User, chat: Chat) => {
  const last = chat.lastmessage;
  if (!last) return chat.isGroupChat ? `${chat.users.length} members` : getSender(me, chat.users).email;

  const mine = last.sender?._id === me._id;
  if (mine) return `You: ${last.content}`;
  if (!chat.isGroupChat) return last.content;
  return `${last.sender ? firstName(last.sender.name) : "Deleted user"}: ${last.content}`;
};

function ChatRow({ chat, me, unread, active, onOpen }: { chat: Chat; me: User; unread: number; active: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      data-chat-row
      onClick={onOpen}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full min-w-0 items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        active ? "bg-accent text-accent-foreground" : "hover:bg-muted"
      )}
    >
      {chat.isGroupChat ? <GroupAvatar id={chat._id} /> : <UserAvatar user={getSender(me, chat.users)} />}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span data-chat-title className="min-w-0 flex-1 truncate font-semibold">
            {chatTitle(me, chat)}
          </span>
          {chat.lastmessage && (
            <span className={cn("shrink-0 text-xs", active ? "" : "text-muted-foreground")}>
              {formatListTime(chat.lastmessage.createdAt)}
            </span>
          )}
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              unread ? "font-semibold text-foreground" : !active && "text-muted-foreground"
            )}
          >
            {preview(me, chat)}
          </span>
          {unread > 0 && (
            <span
              data-testid="row-unread"
              className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[0.6875rem] font-bold text-primary-foreground"
            >
              {unread > 99 ? "99+" : unread}
              <span className="sr-only"> unread</span>
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

const MyChats = () => {
  const { user, chats, chatsState, refreshChats, selectedChat, setSelectedChat, notification } = useChat();
  const [filter, setFilter] = useState("");

  if (!user) return null;

  const unread = new Map<string, number>();
  for (const message of notification) unread.set(message.chat._id, (unread.get(message.chat._id) ?? 0) + 1);

  const wanted = filter.trim().toLowerCase();
  const visible = wanted ? chats.filter((chat) => chatTitle(user, chat).toLowerCase().includes(wanted)) : chats;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 px-4 pb-3 pt-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Chats</h1>
        <div className="grid grid-cols-2 gap-2">
          <Drawer />
          <MakeGroup />
        </div>
        {chats.length > 0 && (
          <SearchField
            label="Filter your chats"
            placeholder="Filter your chats"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        )}
      </div>

      <nav aria-label="Your chats" className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {chatsState === "loading" && !chats.length && (
          <div role="status" className="space-y-1">
            <span className="sr-only">Loading chats</span>
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-3 px-2.5 py-2.5">
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {chatsState === "error" && !chats.length && (
          <div role="alert" className="space-y-3 px-4 py-10 text-center text-sm">
            <p className="text-muted-foreground">Your chats couldn&apos;t be loaded.</p>
            <Button variant="outline" onClick={() => refreshChats()}>
              Try again
            </Button>
          </div>
        )}

        {chatsState === "ready" && !chats.length && (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">No chats yet</p>
            <p className="mt-1">Start one with “New chat”, or bring a few people together in a group.</p>
          </div>
        )}

        {chats.length > 0 && !visible.length && (
          <p role="status" className="px-6 py-10 text-center text-sm text-muted-foreground">
            No chats match “{filter.trim()}”.
          </p>
        )}

        {visible.length > 0 && (
          <ul className="space-y-0.5">
            {visible.map((chat) => (
              <li key={chat._id}>
                <ChatRow
                  chat={chat}
                  me={user}
                  unread={unread.get(chat._id) ?? 0}
                  active={chat._id === selectedChat?._id}
                  onOpen={() => setSelectedChat(chat)}
                />
              </li>
            ))}
          </ul>
        )}
      </nav>
    </div>
  );
};

export default MyChats;
