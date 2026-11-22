"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import { LuSendHorizonal } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { focusComposer } from "@/lib/chat";

const MAX_HEIGHT = 160; // px, about six lines

type Props = {
  chatId: string;
  recipient: string;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function Composer({ chatId, recipient, value, onChange, onSend }: Props) {
  const field = useRef<HTMLTextAreaElement>(null);

  // grow with the text
  useLayoutEffect(() => {
    const box = field.current;
    if (!box) return;
    box.style.height = "auto";
    const height = Math.min(box.scrollHeight + box.offsetHeight - box.clientHeight, MAX_HEIGHT);
    box.style.height = `${height}px`;
    box.style.overflowY = box.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [value, chatId]);

  useEffect(() => {
    focusComposer();
  }, [chatId]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (value.trim()) onSend();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    // Enter that only confirms an IME suggestion. Safari reports it as keyCode 229
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    if (value.trim()) onSend();
  };

  return (
    <form
      onSubmit={submit}
      className="shrink-0 border-t bg-card px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6"
    >
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
        <textarea
          ref={field}
          data-composer
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          aria-label={`Message ${recipient}`}
          placeholder="Write a message"
          enterKeyHint="send"
          className="min-h-11 min-w-0 flex-1 resize-none rounded-3xl border border-input bg-background px-4 py-2.5 text-base leading-6 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-[0.9375rem]"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          disabled={!value.trim()}
          // keep the caret, and the keyboard on phones, in the field
          onMouseDown={(event) => event.preventDefault()}
          className="h-11 w-11 shrink-0 rounded-full"
        >
          <LuSendHorizonal aria-hidden className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
