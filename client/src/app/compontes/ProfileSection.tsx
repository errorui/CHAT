"use client";

import React, { useState } from "react";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

export function ProfileSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 text-card-foreground sm:p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

type Status = { failed: boolean; text: string } | null;

/** Busy and feedback state for one section's save. */
export function useSave() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const save = async (success: string, action: () => Promise<void>) => {
    setBusy(true);
    setStatus(null);
    try {
      await action();
      setStatus({ failed: false, text: success });
    } catch (error) {
      setStatus({ failed: true, text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  return { busy, status, setStatus, save };
}

export function SaveStatus({ status }: { status: Status }) {
  return (
    <p
      role="status"
      className={cn("text-sm empty:hidden", status?.failed ? "font-medium text-destructive" : "text-muted-foreground")}
    >
      {status?.text}
    </p>
  );
}
