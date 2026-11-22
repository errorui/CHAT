"use client";

import React from "react";
import { LuArrowLeft, LuInfo } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useChat } from "@/context/ChatProvider";
import { chatTitle } from "@/lib/chat";
import { getSender } from "../utils/getContact";
import Groupheader from "./Groupheader";
import ProfileModal from "./ProfileModal";
import { GroupAvatar, UserAvatar } from "./UserAvatar";
import { Chat } from "../type";

export function ConversationHeader({ chat, typing }: { chat: Chat; typing: string | null }) {
  const { user, setSelectedChat, notification } = useChat();

  const other = chat.isGroupChat ? null : getSender(user, chat.users);
  const subtitle = other ? other.email : `${chat.users.length} ${chat.users.length === 1 ? "member" : "members"}`;
  const unreadElsewhere = notification.length;

  const details = (
    <button
      type="button"
      data-testid="conversation-title"
      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {other ? <UserAvatar user={other} size="sm" /> : <GroupAvatar id={chat._id} size="sm" />}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold leading-tight">{chatTitle(user, chat)}</span>
        <span className={typing ? "block truncate text-xs font-medium text-primary" : "block truncate text-xs text-muted-foreground"}>
          {typing ?? subtitle}
        </span>
      </span>
      <LuInfo aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="sr-only">, view details</span>
    </button>
  );

  return (
    <header className="flex h-16 shrink-0 items-center gap-1 border-b bg-card px-2 md:px-3">
      <Button
        variant="ghost"
        size="icon"
        className="relative shrink-0 rounded-full md:hidden"
        onClick={() => setSelectedChat(undefined)}
        aria-label={unreadElsewhere ? `Back to chats, ${unreadElsewhere} unread` : "Back to chats"}
      >
        <LuArrowLeft aria-hidden className="h-5 w-5" />
        {unreadElsewhere > 0 && (
          <span aria-hidden className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
        )}
      </Button>

      {other ? (
        <ProfileModal key={chat._id} user={other}>
          {details}
        </ProfileModal>
      ) : (
        <Groupheader key={chat._id} group={chat}>
          {details}
        </Groupheader>
      )}
    </header>
  );
}
