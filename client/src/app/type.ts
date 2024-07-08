

export type User = {
    _id: string;
    name: string;
    email: string;
    ProfilePic: string;
    isAdmin: boolean;
    createdAt: string;
    updatedAt: string;
  };
  
  export type Chat = {
    _id: string;
    chatName: string;
    isGroupChat: boolean;
    users: User[];
    lastMessage: Message[]; 
    groupAdmin: User;
  };
  
  export type Message = {
    _id: string;
    sender: User;
    content: string;
    chat: Chat;
  };
  