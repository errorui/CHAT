"use client";

import { useEffect, useState } from "react";
import { LuWifiOff } from "react-icons/lu";
import { useChat } from "@/context/ChatProvider";

// short blips and the first connect shouldn't flash a warning
const SHOW_AFTER = 3000;

export function ConnectionBanner() {
  const { connection } = useChat();
  const online = connection === "online";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (online) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), SHOW_AFTER);
    return () => clearTimeout(timer);
  }, [online]);

  return (
    <div role="status">
      {visible && (
        <p className="flex items-center justify-center gap-2 bg-foreground px-4 py-1.5 text-center text-xs font-medium text-background">
          <LuWifiOff aria-hidden className="shrink-0" />
          Reconnecting… new messages may be delayed.
        </p>
      )}
    </div>
  );
}
