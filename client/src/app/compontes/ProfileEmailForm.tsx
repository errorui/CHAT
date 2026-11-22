"use client";

import axios from "axios";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChat } from "@/context/ChatProvider";
import { PasswordInput } from "./PasswordInput";
import { ProfileSection, SaveStatus, useSave } from "./ProfileSection";
import { User } from "../type";

export function ProfileEmailForm({ user }: { user: User }) {
  const { updateUser } = useChat();
  const { busy, status, save } = useSave();
  const [draft, setDraft] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const email = draft ?? user.email;
  const changed = !!email.trim() && email.trim().toLowerCase() !== user.email.toLowerCase();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!changed || !password || busy) return;
    void save("Email saved. Use it the next time you sign in.", async () => {
      const { data } = await axios.put<User>("/api/user/user/email", { email: email.trim(), password });
      updateUser(data);
      setDraft(null);
      setPassword("");
    });
  };

  return (
    <ProfileSection title="Email" hint="You sign in with this.">
      <form onSubmit={submit} className="space-y-3">
        <Input
          id="profile-email"
          type="email"
          aria-label="Email"
          autoComplete="email"
          value={email}
          onChange={(event) => setDraft(event.target.value)}
        />
        {changed && (
          <div className="space-y-2">
            <Label htmlFor="email-password">Current password</Label>
            <PasswordInput
              id="email-password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!changed || !password || busy}>
            {busy ? "Saving…" : "Save email"}
          </Button>
          <SaveStatus status={status} />
        </div>
      </form>
    </ProfileSection>
  );
}
