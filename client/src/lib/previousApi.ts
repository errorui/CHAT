// The api used to relay whatever clients emitted. The current one ignores both events.
// This file and its two callers can go once every api instance runs the current code.
import type { Socket } from "socket.io-client";
import type { Message, User } from "@/app/type";

const person = ({ _id, name, email }: User) => ({ _id, name, email });

export const joinOwnRoom = (socket: Socket, userId: string) => {
  socket.emit("setup", { _id: userId });
};

export const relayMessage = (socket: Socket | null, message: Message) => {
  socket?.emit("message", {
    ...message,
    sender: message.sender && person(message.sender),
    chat: { ...message.chat, users: message.chat.users.map(person) },
  });
};
