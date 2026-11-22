"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LuArrowDown } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useChat } from "@/context/ChatProvider";
import { chatTitle } from "@/lib/chat";
import { formatDay, formatTime } from "@/lib/format";
import type { OlderState } from "@/hooks/useConversation";
import { cn } from "@/lib/utils";
import ProfileModal from "./ProfileModal";
import { UserAvatar } from "./UserAvatar";
import { Chat, Message, PendingMessage } from "../type";

const RUN_GAP = 5 * 60 * 1000;
const NEAR_BOTTOM = 80; // px
const NEAR_TOP = 120; // px, where the previous page starts loading

const OLDER_LABEL: Record<OlderState, string> = {
  idle: "Show earlier messages",
  loading: "Loading earlier messages…",
  error: "Couldn't load earlier messages. Try again",
};

const sameDay = (a: Message, b: Message) =>
  new Date(a.createdAt).toDateString() === new Date(b.createdAt).toDateString();

// consecutive messages from one person are drawn as one run
const sameRun = (earlier: Message | undefined, later: Message | undefined) =>
  !!earlier &&
  !!later &&
  earlier.sender?._id === later.sender?._id &&
  sameDay(earlier, later) &&
  new Date(later.createdAt).getTime() - new Date(earlier.createdAt).getTime() < RUN_GAP;

const BUBBLE = "w-fit max-w-full whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[0.9375rem] leading-relaxed [overflow-wrap:anywhere]";

type Props = {
  chat: Chat;
  messages: Message[];
  pending: PendingMessage[];
  history: "loading" | "ready" | "error";
  onRetry: () => void;
  hasOlder: boolean;
  older: OlderState;
  onLoadOlder: () => void;
  typing: string | null;
};

// memo, otherwise every key press in the composer re-renders the whole history
export const MessageList = React.memo(function MessageList({
  chat,
  messages,
  pending,
  history,
  onRetry,
  hasOlder,
  older,
  onLoadOlder,
  typing,
}: Props) {
  const { user } = useChat();
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const previous = useRef({ first: "", last: "", pending: 0 });
  // stays the same when messages are added above, so it marks the reader's place
  const fromBottom = useRef(0);
  const [showJump, setShowJump] = useState(false);

  const last = messages[messages.length - 1];
  const lastId = last?._id ?? "";
  const firstId = messages[0]?._id ?? "";
  const lastIsMine = !!last && last.sender?._id === user?._id;

  const toBottom = useCallback(() => {
    const list = scroller.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
    atBottom.current = true;
    setShowJump(false);
  }, []);

  useLayoutEffect(() => {
    const list = scroller.current;
    const arrived = previous.current.last !== lastId;
    const prepended = previous.current.first !== firstId;
    const sending = pending.length > previous.current.pending;
    previous.current = { first: firstId, last: lastId, pending: pending.length };

    // follow along, but never pull someone away from older messages they are reading
    if (atBottom.current || sending || (arrived && lastIsMine)) toBottom();
    else {
      if (prepended && list) list.scrollTop = list.scrollHeight - fromBottom.current;
      if (arrived) setShowJump(true);
    }
    if (list) fromBottom.current = list.scrollHeight - list.scrollTop;
  }, [firstId, lastId, lastIsMine, pending.length, typing, history, toBottom]);

  // the composer growing, or a phone keyboard, shrinks the list
  useEffect(() => {
    if (!scroller.current || !content.current) return;
    const observer = new ResizeObserver(() => {
      if (atBottom.current) toBottom();
    });
    observer.observe(scroller.current);
    observer.observe(content.current);
    return () => observer.disconnect();
  }, [toBottom]);

  const onScroll = () => {
    const list = scroller.current;
    if (!list) return;
    fromBottom.current = list.scrollHeight - list.scrollTop;
    atBottom.current = fromBottom.current - list.clientHeight < NEAR_BOTTOM;
    if (atBottom.current) setShowJump(false);
    // only from idle: after a failure it waits for a click instead of retrying on every scroll
    else if (hasOlder && older === "idle" && list.scrollTop < NEAR_TOP) onLoadOlder();
  };

  const empty = history === "ready" && !messages.length && !pending.length;

  return (
    <div className="relative min-h-0 flex-1 bg-canvas">
      <div
        ref={scroller}
        onScroll={onScroll}
        role="log"
        aria-label="Messages"
        aria-busy={history === "loading" || older === "loading"}
        tabIndex={0}
        className="h-full overflow-y-auto overflow-x-hidden overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div ref={content} className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end px-3 py-4 sm:px-6">
          {history === "loading" && !messages.length && (
            <div className="space-y-3">
              <span className="sr-only">Loading messages</span>
              {["w-1/2", "w-2/5 self-end", "w-3/5", "w-1/3 self-end"].map((shape) => (
                <div key={shape} className="flex flex-col">
                  <div className={cn("h-10 animate-pulse rounded-2xl bg-muted-foreground/10", shape)} />
                </div>
              ))}
            </div>
          )}

          {history === "error" && (
            <div role="alert" className="my-auto space-y-3 py-10 text-center text-sm">
              <p className="text-muted-foreground">These messages couldn&apos;t be loaded.</p>
              <Button variant="outline" onClick={onRetry}>
                Try again
              </Button>
            </div>
          )}

          {empty && (
            <div className="my-auto py-10 text-center">
              <p className="font-display text-xl font-bold [overflow-wrap:anywhere]">
                {chat.isGroupChat ? `Welcome to ${chat.chatName}` : `Say hello to ${chatTitle(user, chat)}`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">There are no messages here yet.</p>
            </div>
          )}

          {hasOlder && messages.length > 0 && (
            <div className="flex h-10 shrink-0 items-center justify-center">
              <Button variant="ghost" size="sm" onClick={onLoadOlder} aria-disabled={older === "loading"}>
                {OLDER_LABEL[older]}
              </Button>
            </div>
          )}

          {messages.map((message, index) => {
            const before = messages[index - 1];
            const after = messages[index + 1];
            const mine = !!message.sender && message.sender._id === user?._id;
            const startsRun = !sameRun(before, message);
            const endsRun = !sameRun(message, after);
            const newDay = !before || !sameDay(before, message);
            const showPerson = chat.isGroupChat && !mine;

            return (
              <React.Fragment key={message._id}>
                {newDay && (
                  <div className="my-4 flex items-center gap-3 text-xs font-medium text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    {formatDay(message.createdAt)}
                    <span className="h-px flex-1 bg-border" />
                  </div>
                )}

                <div
                  data-message
                  data-mine={mine}
                  className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start", startsRun && !newDay ? "mt-3" : "mt-0.5")}
                >
                  {showPerson && (
                    <div className={cn("w-7 shrink-0", endsRun && "mb-5")}>
                      {endsRun && message.sender && (
                        <ProfileModal user={message.sender}>
                          <button
                            type="button"
                            aria-label={`View ${message.sender.name}'s profile`}
                            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <UserAvatar user={message.sender} size="xs" />
                          </button>
                        </ProfileModal>
                      )}
                    </div>
                  )}

                  <div className={cn("flex min-w-0 max-w-[82%] flex-col sm:max-w-[70%]", mine ? "items-end" : "items-start")}>
                    {showPerson && startsRun && (
                      <span className="mb-1 max-w-full truncate px-1 text-xs font-semibold text-muted-foreground">
                        {message.sender?.name ?? "Deleted user"}
                      </span>
                    )}
                    <p
                      data-bubble
                      className={cn(
                        BUBBLE,
                        mine
                          ? "bg-primary text-primary-foreground selection:bg-foreground/30"
                          : "bg-card text-card-foreground shadow-sm",
                        endsRun && (mine ? "rounded-br-md" : "rounded-bl-md")
                      )}
                    >
                      {message.content}
                    </p>
                    {endsRun && (
                      <time dateTime={message.createdAt} className="mt-1 h-4 px-1 text-[0.6875rem] leading-4 text-muted-foreground">
                        {formatTime(message.createdAt)}
                      </time>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {pending.map((item) => (
            <div key={item.id} className="mt-0.5 flex justify-end">
              <div className="flex min-w-0 max-w-[82%] flex-col items-end sm:max-w-[70%]">
                <p className={cn(BUBBLE, "border border-dashed border-primary bg-card text-card-foreground")}>{item.content}</p>
                <span className="mt-1 h-4 px-1 text-[0.6875rem] leading-4 text-muted-foreground">Sending…</span>
              </div>
            </div>
          ))}

          {typing && (
            <div role="status" className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span aria-hidden className="flex gap-1 rounded-2xl rounded-bl-md bg-card px-3 py-2.5 shadow-sm">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="h-1.5 w-1.5 animate-typing rounded-full bg-muted-foreground"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
              {typing}
            </div>
          )}
        </div>
      </div>

      {showJump && (
        <Button
          size="sm"
          onClick={toBottom}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 gap-1.5 rounded-full shadow-lg"
        >
          <LuArrowDown aria-hidden />
          New messages
        </Button>
      )}
    </div>
  );
});
