export type User = {
  _id: string;
  name: string;
  email: string;
  avatarVersion?: number;
  isAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Chat = {
  _id: string;
  chatName: string;
  isGroupChat: boolean;
  users: User[];
  lastmessage?: Message;
  groupAdmin?: User;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  _id: string;
  // null once that account is deleted
  sender: User | null;
  content: string;
  createdAt: string;
  // only _id can be relied on, how much of the chat is populated differs by endpoint
  chat: Chat;
};

// shown while a message is on its way to the server
export type PendingMessage = {
  id: string;
  chatId: string;
  content: string;
};
