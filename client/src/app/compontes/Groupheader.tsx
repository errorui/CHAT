import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useChat } from '@/context/ChatProvider';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { useRouter } from "next/navigation";
import UserListItem from './UserListItem';
import { Label } from '@/components/ui/label';

const API_URL = 'https://chat-12-z8u3.onrender.com';

import { User, Chat, Message } from '../type';

interface GroupInfoProps {
  info: Chat;
  fetchAgain: boolean;
  setFetchAgain: React.Dispatch<React.SetStateAction<boolean>>;
}

function GroupInfo({ info, fetchAgain, setFetchAgain }: GroupInfoProps) {
  const { user, selectedChat, setSelectedChat } = useChat();
  const router = useRouter();
  const [search, setSearch] = useState<string>("");
  const [group, setGroup] = useState<string>("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [open, setOpen] = useState<boolean>(false);

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (query === "") {
      return;
    }
    try {
      const { data } = await axios.get(`${API_URL}/api/user?search=${search}`, { withCredentials: true });
      console.log(data);
      setSearchResults(data);
    } catch (error) {
      alert("Something went wrong");
    }
  }

  const handleRename = async () => {
    if (group === "") {
      alert("Enter something");
      return;
    }
    try {
      const { data } = await axios.put(`${API_URL}/api/chat/rename`, {
        chatId: selectedChat?._id,
        chatName: group,
      }, {
        withCredentials: true
      });
      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
    } catch (error) {
      console.log(error);
      alert("Error");
    }
  }

  const handleAddUser = async (user1: User) => {
    if (selectedChat?.users.find((u:any) => u._id === user1._id)) {
      alert("User already in group");
      return;
    }
    try {
      const { data } = await axios.put(`${API_URL}/api/chat/groupadd`, {
        chatId: selectedChat?._id,
        userId: user1._id,
      }, {
        withCredentials: true
      });
      setFetchAgain(!fetchAgain);
      setSelectedChat(data);
    } catch (error) {
      alert("Error");
    }
  }

  const handleRemove = async (user1: User) => {
    try {
      const { data } = await axios.put(`${API_URL}/api/chat/groupremove`, {
        chatId: selectedChat?._id,
        userId: user1._id,
      }, {
        withCredentials: true
      });
      if (user && user._id === user1._id) {
        setFetchAgain(!fetchAgain);
        setOpen(false);
        setSelectedChat(undefined);
      } else {
        setFetchAgain(!fetchAgain);
        setSelectedChat(data);
      }
    } catch (error) {
      console.log(error);
      alert("Error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">View</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{info.chatName}</DialogTitle>
          <DialogDescription>
            <div className="flex my-4">
              <Input
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                type='text'
                placeholder='Enter new group name'
              />
              <Button onClick={() => {
                handleRename();
                setGroup("");
              }}>Submit</Button>
            </div>
            <div>
              {user?.name === info.groupAdmin.name ? (
                <div>
                  <h1>Hi group admin</h1>
                  {info.users.map((e: User) => (
                    <Badge onClick={() => handleRemove(e)} key={e._id}>
                      {e.name}{e.name === info.groupAdmin.name ? ':admin' : null}
                    </Badge>
                  ))}
                  <div>
                    <Label htmlFor="name" className="text-right">
                      Add new member
                    </Label>
                    <Input
                      id="name"
                      value={search}
                      placeholder='Add'
                      onChange={(e) => handleSearch(e.target.value)}
                      className="col-span-3"
                    />
                    <div className='mt-6'>
                      {searchResults && searchResults.map((i: User) => (
                        <UserListItem key={i._id} i={i} handlefunction={() => handleAddUser(i)} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                info.users.map((e: User) => (
                  <Badge key={e._id}>
                    {e.name}{e.name === info.groupAdmin.name ? ':admin' : null}
                  </Badge>
                ))
              )}
            </div>
            <Button
              variant={"destructive"}
              className='mt-5 w-full'
              onClick={() => handleRemove(user!)}
            >
              Exit
            </Button>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

interface GroupHeaderProps {
  group: Chat;
  fetchAgain: boolean;
  setFetchAgain: React.Dispatch<React.SetStateAction<boolean>>;
}

const GroupHeader = ({ group, fetchAgain, setFetchAgain }: GroupHeaderProps) => {
  return (
    <div className="flex-grow-1 flex items-center justify-between">
      <h1>{group.chatName}</h1>
      <GroupInfo fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} info={group} />
    </div>
  );
}

export default GroupHeader;
