"use client";

import React, { useRef, useState } from "react";
import { LuMessageCircle } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useChat } from "@/context/ChatProvider";
import { focusComposer } from "@/lib/chat";
import { errorMessage } from "@/lib/errors";
import { UserAvatar } from "./UserAvatar";
import { User } from "../type";

type Props = {
  user: User;
  /** the element that opens the dialog, defaults to the avatar */
  children?: React.ReactNode;
  // pass both to open it from somewhere else, like a menu item
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const ProfileModal = ({ user, children, open, onOpenChange }: Props) => {
  const { user: me, selectedChat, openDirectChat } = useChat();
  const { toast } = useToast();
  const [ownOpen, setOwnOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const openedChat = useRef(false);

  const controlled = open !== undefined;
  const setOpen = onOpenChange ?? setOwnOpen;

  const isMe = user._id === me?._id;
  const alreadyThere =
    !!selectedChat && !selectedChat.isGroupChat && selectedChat.users.some((member) => member._id === user._id);
  const canMessage = !!user._id && !isMe && !alreadyThere;

  const message = async () => {
    setBusy(true);
    try {
      await openDirectChat(user._id);
      openedChat.current = true;
      setOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Could not open the chat", description: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={controlled ? open : ownOpen} onOpenChange={setOpen}>
      {!controlled && (
        <DialogTrigger asChild>
          {children ?? (
            <button type="button" aria-label={`View ${user.name}'s profile`} className="rounded-full">
              <UserAvatar user={user} />
            </button>
          )}
        </DialogTrigger>
      )}
      <DialogContent
        className="max-w-sm"
        onCloseAutoFocus={(event) => {
          if (!openedChat.current) return;
          openedChat.current = false;
          event.preventDefault();
          focusComposer();
        }}
      >
        <DialogHeader className="items-center pt-4 text-center sm:text-center">
          <UserAvatar user={user} size="lg" className="mb-3" />
          <DialogTitle className="max-w-full font-display text-2xl leading-tight [overflow-wrap:anywhere]">
            {user.name}
          </DialogTitle>
          <DialogDescription className="max-w-full [overflow-wrap:anywhere]">
            {user.email || "This account no longer exists."}
            {isMe && " (you)"}
          </DialogDescription>
        </DialogHeader>
        {canMessage && (
          <Button onClick={message} disabled={busy} className="w-full gap-2">
            <LuMessageCircle aria-hidden />
            {busy ? "Opening…" : "Message"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
