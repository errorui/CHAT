"use client";

import React, { useState } from "react";
import { LuBell, LuLogOut, LuUser } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useChat } from "@/context/ChatProvider";
import { chatTitle } from "@/lib/chat";
import { errorMessage } from "@/lib/errors";
import { Logo } from "./Logo";
import ProfileModal from "./ProfileModal";
import { ThemeMenuItem } from "./ThemeMenuItem";
import { UserAvatar } from "./UserAvatar";
import { Chat, Message } from "../type";

type Unread = { chat: Chat; count: number; latest: Message };

const Header = () => {
  const { user, signOut, chats, notification, setSelectedChat } = useChat();
  const { toast } = useToast();
  const [profileOpen, setProfileOpen] = useState(false);

  if (!user) return null;

  // one row per chat, newest first. Chats we were removed from drop out
  const byChat = new Map<string, Unread>();
  for (let index = notification.length - 1; index >= 0; index--) {
    const message = notification[index];
    const seen = byChat.get(message.chat._id);
    if (seen) {
      seen.count += 1;
      continue;
    }
    // the copy from the list, the notification's one has no populated admin
    const chat = chats.find((item) => item._id === message.chat._id);
    if (chat) byChat.set(chat._id, { chat, count: 1, latest: message });
  }
  const unread = Array.from(byChat.values());
  const total = unread.reduce((sum, item) => sum + item.count, 0);

  const logout = async () => {
    try {
      await signOut();
    } catch (error) {
      toast({ variant: "destructive", title: "Could not sign out", description: errorMessage(error) });
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
      <Logo />

      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full"
              aria-label={total ? `Notifications, ${total} unread` : "Notifications"}
            >
              <LuBell aria-hidden className="h-5 w-5" />
              {total > 0 && (
                <span
                  data-testid="bell-count"
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.6875rem] font-bold text-primary-foreground"
                >
                  {total > 99 ? "99+" : total}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-1.5rem)]">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!unread.length && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
            )}
            {unread.map(({ chat, count, latest }) => (
              <DropdownMenuItem key={chat._id} onSelect={() => setSelectedChat(chat)} className="gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{chatTitle(user, chat)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {chat.isGroupChat && latest.sender ? `${latest.sender.name}: ` : ""}
                    {latest.content}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                  {count}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Your account"
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <UserAvatar user={user} size="sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-1.5rem)]">
            <DropdownMenuLabel>
              <span className="block truncate">{user.name}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setProfileOpen(true)} className="gap-2 py-2">
              <LuUser aria-hidden />
              Profile
            </DropdownMenuItem>
            <ThemeMenuItem />
            <DropdownMenuItem onSelect={logout} className="gap-2 py-2 text-destructive focus:text-destructive">
              <LuLogOut aria-hidden />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileModal user={user} open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  );
};

export default Header;
