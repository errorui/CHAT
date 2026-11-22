import { getSender } from "@/app/utils/getContact";
import type { Chat, User } from "@/app/type";

export const chatTitle = (me: User | null, chat: Chat): string =>
  chat.isGroupChat ? chat.chatName : getSender(me, chat.users).name;

export const firstName = (name = "") => name.trim().split(/\s+/)[0] ?? "";

// on phones focusing would pop the keyboard up over the conversation
export const focusComposer = () => {
  if (!window.matchMedia("(min-width: 768px)").matches) return;
  document.querySelector<HTMLTextAreaElement>("textarea[data-composer]")?.focus();
};
