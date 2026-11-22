"use client";

import React, { useRef, useState } from "react";
import { LuMessageSquarePlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { useChat } from "@/context/ChatProvider";
import { useUserSearch } from "@/hooks/useUserSearch";
import { focusComposer } from "@/lib/chat";
import { errorMessage } from "@/lib/errors";
import { SearchField } from "./SearchField";
import UserListItem from "./UserListItem";
import { UserSearchResults } from "./UserSearchResults";

/** The "new chat" panel. */
export function Drawer({ children }: { children?: React.ReactNode }) {
  const { openDirectChat } = useChat();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [opening, setOpening] = useState<string>();
  const openedChat = useRef(false);
  const { results, state } = useUserSearch(query, open);

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  const start = async (userId: string) => {
    setOpening(userId);
    try {
      await openDirectChat(userId);
      openedChat.current = true;
      changeOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Could not open the chat", description: errorMessage(error) });
    } finally {
      setOpening(undefined);
    }
  };

  return (
    <Sheet open={open} onOpenChange={changeOpen}>
      <SheetTrigger asChild>
        {children ?? (
          <Button className="gap-2">
            <LuMessageSquarePlus aria-hidden />
            New chat
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-sm"
        onCloseAutoFocus={(event) => {
          if (!openedChat.current) return;
          openedChat.current = false;
          event.preventDefault();
          focusComposer();
        }}
      >
        <div className="space-y-4 border-b p-5">
          <SheetHeader className="pr-8 text-left">
            <SheetTitle className="font-display text-2xl">New chat</SheetTitle>
            <SheetDescription>Find someone by name or email.</SheetDescription>
          </SheetHeader>
          <SearchField
            label="Search people"
            placeholder="Search people"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
          <UserSearchResults state={state} results={results}>
            {(person) => (
              <UserListItem
                i={person}
                disabled={!!opening}
                handlefunction={() => start(person._id)}
                trailing={opening === person._id && <span className="text-xs text-muted-foreground">Opening…</span>}
              />
            )}
          </UserSearchResults>
        </div>
      </SheetContent>
    </Sheet>
  );
}
