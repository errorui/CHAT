"use client";

import { useEffect, useState } from "react";
import { useChat } from "@/context/ChatProvider";

// free hosting puts the api to sleep, and the first request then hangs while it boots
const SLOW_AFTER = 5000;

export function useWakingUp() {
  const { session } = useChat();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (session !== "loading") {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER);
    return () => clearTimeout(timer);
  }, [session]);

  return session === "unreachable" || slow;
}
