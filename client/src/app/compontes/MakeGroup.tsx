"use client";

import axios from "axios";
import React, { useRef, useState } from "react";
import { LuCheck, LuUsers, LuX } from "react-icons/lu";
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
import { focusComposer } from "@/lib/chat";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { SearchField } from "./SearchField";
import UserListItem from "./UserListItem";
import { UserSearchResults } from "./UserSearchResults";
import { Chat, User } from "../type";

const MIN_OTHERS = 2; // the api wants at least two besides you

const MakeGroup = ({ children }: { children?: React.ReactNode }) => {
  const { setChats, setSelectedChat, refreshChats } = useChat();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const created = useRef(false);
  const { results, state } = useUserSearch(query, open);

  const toggle = (person: User) =>
    setMembers((list) =>
      list.some((member) => member._id === person._id)
        ? list.filter((member) => member._id !== person._id)
        : [...list, person]
    );

  const missing = MIN_OTHERS - members.length;
  const hint =
    missing > 0
      ? `Pick ${missing} more ${missing === 1 ? "person" : "people"}`
      : !name.trim()
        ? "Give the group a name"
        : `${members.length + 1} members, including you`;
  const valid = missing <= 0 && !!name.trim();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    try {
      const { data } = await axios.post<Chat>("/api/chat/group", {
        name: name.trim(),
        users: JSON.stringify(members.map((member) => member._id)),
      });
      // the socket refresh may have added it already
      setChats((list) => [data, ...list.filter((chat) => chat._id !== data._id)]);
      setSelectedChat(data);
      void refreshChats();
      created.current = true;
      setOpen(false);
      setName("");
      setQuery("");
      setMembers([]);
    } catch (error) {
      toast({ variant: "destructive", title: "Could not create the group", description: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="secondary" className="gap-2">
            <LuUsers aria-hidden />
            New group
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-w-md"
        onCloseAutoFocus={(event) => {
          if (!created.current) return;
          created.current = false;
          event.preventDefault();
          focusComposer();
        }}
      >
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="font-display text-2xl">New group</DialogTitle>
          <DialogDescription>Name it, then pick at least two other people.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="min-w-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupname">Group name</Label>
            <Input
              id="groupname"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Weekend trip"
              autoComplete="off"
            />
          </div>

          {members.length > 0 && (
            <ul aria-label="Selected people" className="flex flex-wrap gap-1.5">
              {members.map((member) => (
                <li key={member._id} className="max-w-full">
                  <button
                    type="button"
                    onClick={() => toggle(member)}
                    aria-label={`Remove ${member.name}`}
                    className="flex max-w-full items-center gap-1.5 rounded-full bg-accent py-1 pl-3 pr-2 text-sm text-accent-foreground hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="truncate">{member.name}</span>
                    <LuX aria-hidden className="shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <SearchField
            label="Search people to add"
            placeholder="Search people to add"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              // enter in the search must not create the group
              if (event.key === "Enter") event.preventDefault();
            }}
          />

          <div className="-mx-2 h-56 overflow-y-auto px-1">
            <UserSearchResults state={state} results={results}>
              {(person) => {
                const picked = members.some((member) => member._id === person._id);
                return (
                  <UserListItem
                    i={person}
                    selected={picked}
                    handlefunction={() => toggle(person)}
                    trailing={
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                          picked ? "border-primary bg-primary text-primary-foreground" : "border-input"
                        )}
                      >
                        {picked && <LuCheck className="h-3 w-3" />}
                      </span>
                    }
                  />
                );
              }}
            </UserSearchResults>
          </div>

          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {hint}
            </p>
            <Button type="submit" disabled={!valid || saving}>
              {saving ? "Creating…" : "Create group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MakeGroup;
