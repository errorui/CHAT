"use client";

import axios from "axios";
import React, { useState } from "react";
import { LuLogOut, LuUserPlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useChat } from "@/context/ChatProvider";
import { useUserSearch } from "@/hooks/useUserSearch";
import { errorMessage } from "@/lib/errors";
import { SearchField } from "./SearchField";
import { GroupAvatar, UserAvatar } from "./UserAvatar";
import UserListItem from "./UserListItem";
import { UserSearchResults } from "./UserSearchResults";
import { Chat, User } from "../type";

const LEAVE = "leave";

function GroupInfo({ group, close }: { group: Chat; close: () => void }) {
  const { user, setSelectedChat, refreshChats } = useChat();
  const { toast } = useToast();

  // null until edited, so a rename by someone else shows up here
  const [draftName, setDraftName] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string>();
  const [confirming, setConfirming] = useState<string>();

  const adminId = group.groupAdmin?._id;
  const isAdmin = !!user && user._id === adminId;
  const { results, state } = useUserSearch(query, isAdmin && !!query.trim());

  const name = draftName ?? group.chatName;
  const renamed = !!name.trim() && name.trim() !== group.chatName;

  const show = (updated: Chat) => setSelectedChat((open) => (open?._id === updated._id ? updated : open));

  const run = async (key: string, failure: string, action: () => Promise<void>) => {
    setBusy(key);
    try {
      await action();
      setConfirming(undefined);
      void refreshChats();
    } catch (error) {
      toast({ variant: "destructive", title: failure, description: errorMessage(error) });
    } finally {
      setBusy(undefined);
    }
  };

  const rename = (event: React.FormEvent) => {
    event.preventDefault();
    if (!renamed) return;
    void run("rename", "Could not rename the group", async () => {
      const { data } = await axios.put<Chat>("/api/chat/rename", { chatId: group._id, chatName: name.trim() });
      show(data);
      setDraftName(null);
    });
  };

  const add = (person: User) =>
    run(person._id, `Could not add ${person.name}`, async () => {
      const { data } = await axios.put<Chat>("/api/chat/groupadd", { chatId: group._id, userId: person._id });
      show(data);
      setQuery("");
    });

  const remove = (person: User) =>
    run(person._id, `Could not remove ${person.name}`, async () => {
      const { data } = await axios.put<Chat>("/api/chat/groupremove", { chatId: group._id, userId: person._id });
      show(data);
    });

  const leave = () =>
    run(LEAVE, "Could not leave the group", async () => {
      await axios.put("/api/chat/groupremove", { chatId: group._id, userId: user?._id });
      close();
      setSelectedChat((open) => (open?._id === group._id ? undefined : open));
    });

  const leaveNote =
    group.users.length === 1
      ? "You're the last one here, so the group will be deleted."
      : isAdmin
        ? "Someone else will become the admin."
        : "You'll need the admin to add you back.";

  return (
    <div className="min-w-0 space-y-6">
      <DialogHeader className="items-center space-y-2 pt-2 text-center sm:text-center">
        <GroupAvatar id={group._id} size="lg" />
        <DialogTitle className="max-w-full font-display text-2xl leading-tight [overflow-wrap:anywhere]">
          {group.chatName}
        </DialogTitle>
        <DialogDescription>
          {group.users.length} {group.users.length === 1 ? "member" : "members"}
          {isAdmin && ", you are the admin"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={rename} className="space-y-2">
        <Label htmlFor="group-rename">Group name</Label>
        <div className="flex gap-2">
          <Input
            id="group-rename"
            value={name}
            onChange={(event) => setDraftName(event.target.value)}
            autoComplete="off"
            className="min-w-0"
          />
          <Button type="submit" variant="secondary" disabled={!renamed || busy === "rename"}>
            Save
          </Button>
        </div>
      </form>

      <section aria-labelledby="group-members" className="space-y-2">
        <h3 id="group-members" className="text-sm font-medium">
          Members
        </h3>
        <ul>
          {group.users.map((member) => {
            const isMe = member._id === user?._id;
            return (
              <li key={member._id} className="flex min-w-0 items-center gap-3 py-2">
                <UserAvatar user={member} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {member.name}
                    {isMe && <span className="font-normal text-muted-foreground"> (you)</span>}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
                </span>

                {member._id === adminId ? (
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                    Admin
                  </span>
                ) : (
                  isAdmin &&
                  !isMe &&
                  (confirming === member._id ? (
                    <span className="flex shrink-0 gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setConfirming(undefined)}>
                        Cancel
                      </Button>
                      <Button size="sm" variant="destructive" disabled={busy === member._id} onClick={() => remove(member)}>
                        Remove
                      </Button>
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 text-destructive hover:text-destructive"
                      aria-label={`Remove ${member.name} from the group`}
                      onClick={() => setConfirming(member._id)}
                    >
                      Remove
                    </Button>
                  ))
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {isAdmin && (
        <section aria-labelledby="group-add" className="space-y-2">
          <h3 id="group-add" className="text-sm font-medium">
            Add people
          </h3>
          <SearchField
            label="Search people to add"
            placeholder="Search by name or email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="max-h-48 overflow-y-auto p-0.5">
            <UserSearchResults state={state} results={results}>
              {(person) => {
                const already = group.users.some((member) => member._id === person._id);
                return (
                  <UserListItem
                    i={person}
                    disabled={already || busy === person._id}
                    handlefunction={() => add(person)}
                    trailing={
                      already ? (
                        <span className="shrink-0 text-xs text-muted-foreground">Already in</span>
                      ) : (
                        <LuUserPlus aria-hidden className="shrink-0 text-primary" />
                      )
                    }
                  />
                );
              }}
            </UserSearchResults>
          </div>
        </section>
      )}

      <div className="border-t pt-4">
        {confirming === LEAVE ? (
          <div className="space-y-3">
            <p className="text-sm">
              Leave <strong className="[overflow-wrap:anywhere]">{group.chatName}</strong>? {leaveNote}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirming(undefined)}>
                Stay
              </Button>
              <Button variant="destructive" className="flex-1" disabled={busy === LEAVE} onClick={leave}>
                Leave group
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full gap-2 text-destructive hover:text-destructive"
            onClick={() => setConfirming(LEAVE)}
          >
            <LuLogOut aria-hidden />
            Leave group
          </Button>
        )}
      </div>
    </div>
  );
}

const GroupHeader = ({ group, children }: { group: Chat; children?: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children ?? <Button variant="ghost">{group.chatName}</Button>}</DialogTrigger>
      {/* no autofocus, it would raise the keyboard over the member list on phones */}
      <DialogContent className="max-w-md" onOpenAutoFocus={(event) => {
        event.preventDefault();
        (event.currentTarget as HTMLElement | null)?.focus();
      }}>
        <GroupInfo group={group} close={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default GroupHeader;
