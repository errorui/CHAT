import React from "react";
import { User } from "../type";

export function UserSearchResults({
  state,
  results,
  children,
}: {
  state: "idle" | "loading" | "ready" | "error";
  results: User[];
  children: (user: User) => React.ReactNode;
}) {
  if (state === "idle") return null;

  // keep showing the previous results while the next ones load, to avoid flicker
  if (state === "loading" && !results.length) {
    return (
      <div role="status" className="space-y-1">
        <span className="sr-only">Searching</span>
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex items-center gap-3 px-2.5 py-2">
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (state === "error") {
    return (
      <p role="alert" className="px-2.5 py-6 text-center text-sm text-destructive">
        Search failed. Check your connection and type again.
      </p>
    );
  }

  if (!results.length) {
    return (
      <p role="status" className="px-2.5 py-6 text-center text-sm text-muted-foreground">
        No one matches that. Try another name or email.
      </p>
    );
  }

  return (
    <ul className="space-y-0.5" aria-busy={state === "loading"}>
      {results.map((user) => (
        <li key={user._id}>{children(user)}</li>
      ))}
    </ul>
  );
}
