"use client";

import axios from "axios";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/context/ChatProvider";
import { ProfileSection, SaveStatus, useSave } from "./ProfileSection";
import { User } from "../type";

export function ProfileNameForm({ user }: { user: User }) {
  const { updateUser } = useChat();
  const { busy, status, save } = useSave();
  const [draft, setDraft] = useState<string | null>(null);

  const name = draft ?? user.name;
  const changed = !!name.trim() && name.trim() !== user.name;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!changed || busy) return;
    void save("Name saved.", async () => {
      const { data } = await axios.patch<User>("/api/user/user", { name: name.trim() });
      updateUser(data);
      setDraft(null);
    });
  };

  return (
    <ProfileSection title="Name" hint="Everyone you chat with sees this.">
      <form onSubmit={submit} className="space-y-3">
        <Input
          id="profile-name"
          aria-label="Name"
          autoComplete="name"
          maxLength={80}
          value={name}
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!changed || busy}>
            {busy ? "Saving…" : "Save name"}
          </Button>
          <SaveStatus status={status} />
        </div>
      </form>
    </ProfileSection>
  );
}
