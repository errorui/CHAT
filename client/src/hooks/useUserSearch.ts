"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import type { User } from "@/app/type";

type SearchState = "idle" | "loading" | "ready" | "error";

/** Debounced people search. An empty query lists people to start from. */
export function useUserSearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<User[]>([]);
  const [state, setState] = useState<SearchState>("idle");
  const search = query.trim();

  useEffect(() => {
    if (!enabled) {
      setResults([]);
      setState("idle");
      return;
    }

    let cancelled = false;
    setState("loading");
    const timer = setTimeout(
      async () => {
        try {
          const { data } = await axios.get<User[]>("/api/user", { params: search ? { search } : {} });
          if (cancelled) return;
          setResults(data);
          setState("ready");
        } catch {
          if (cancelled) return;
          setResults([]);
          setState("error");
        }
      },
      search ? 220 : 0
    );

    // an answer for an older query is never shown
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, enabled]);

  return { results, state };
}
