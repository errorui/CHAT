"use client";

import axios from "axios";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useChat } from "@/context/ChatProvider";
import { PasswordInput } from "./PasswordInput";
import { ProfileSection, SaveStatus, useSave } from "./ProfileSection";
import { User } from "../type";

const EMPTY = { current: "", next: "", confirm: "" };
const FIELDS = [
  ["current", "Current password", "current-password"],
  ["next", "New password", "new-password"],
  ["confirm", "Confirm new password", "new-password"],
] as const;

export function ProfilePasswordForm({ user }: { user: User }) {
  const { sessionChanged } = useChat();
  const { busy, status, setStatus, save } = useSave();
  const [values, setValues] = useState(EMPTY);

  const complete = !!values.current && !!values.next && !!values.confirm;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!complete || busy) return;
    if (values.next !== values.confirm) {
      setStatus({ failed: true, text: "The new passwords don't match." });
      return;
    }
    void save("Password changed. Your other devices were signed out.", async () => {
      await axios.put("/api/user/user/password", { currentPassword: values.current, newPassword: values.next });
      setValues(EMPTY);
      sessionChanged();
    });
  };

  return (
    <ProfileSection title="Password" hint="Changing it signs you out on your other devices.">
      <form onSubmit={submit} className="space-y-3">
        {/* lets password managers update the right account */}
        <input type="email" autoComplete="username" value={user.email} readOnly hidden />
        {FIELDS.map(([key, label, autoComplete]) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`password-${key}`}>{label}</Label>
            <PasswordInput
              id={`password-${key}`}
              autoComplete={autoComplete}
              value={values[key]}
              onChange={(event) => setValues((all) => ({ ...all, [key]: event.target.value }))}
            />
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!complete || busy}>
            {busy ? "Changing…" : "Change password"}
          </Button>
          <SaveStatus status={status} />
        </div>
      </form>
    </ProfileSection>
  );
}
