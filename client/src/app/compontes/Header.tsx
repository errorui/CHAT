import { useChat } from '@/context/ChatProvider'
import React from 'react'
import { Button } from "@/components/ui/button"

  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "@/components/ui/avatar"
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
  } from "@/components/ui/dialog"

  import { FaRegBell,FaAngleDown,FaRegUser  } from "react-icons/fa";

  import axios from 'axios';
  import { useRouter } from "next/navigation"
  
  import { useToast } from '@/components/ui/use-toast'
import { Drawer } from './Drawer'
import { getSender } from '../utils/getContact'
import { User, Chat, Message } from '../type';



  const API_URL = 'https://chat-12-z8u3.onrender.com';


const Header = () => {
  const {
    setSelectedChat,
    user,
    notification,
    setNotification,
    setUser,
    chats,
    setChats,
  } = useChat();

    const { toast } = useToast()
    const router = useRouter();
    const getImageSrc = (user:User) => {
        const mimeType ="image/jpeg";
        return `data:${mimeType};base64,${user.ProfilePic}`;
      };
    const logout = async () => {
        try {
          
          await axios.get(`${API_URL}/api/user/logout`,  { withCredentials: true });
          toast({
            title: "logout succesfully",
         
          })
          setUser(null)
          setSelectedChat(undefined)
         
       
      
        } catch (error) {
          console.error('Error logging out:', error);
        }
      };
 
  return (
    <div className="flex p-3 bg-white shadow-lg items-center justify-between">
        <Drawer></Drawer>
         <h1 className="text-3xl">talk-</h1>
         <div className="flex gap-2 items-center">
    <DropdownMenu>
  <DropdownMenuTrigger asChild>
  <div className="relative">
  <Button variant={"default"} >
  <FaRegBell />
</Button>
{notification.length && <div className=" -top-[9px] right-[25px] absolute text-center p-3 flex items-center justify-center size-5 bg-red-600 text-white rounded-full">{notification.length} </div>
 
 }
</div>
  </DropdownMenuTrigger>
  <DropdownMenuContent >
  
      {!notification.length && <h1>  "No New Messages"</h1> }
        {notification.map((notif:any) => (
                <div
                  key={notif._id}
                  onClick={() => {
                    setSelectedChat(notif.chat);
                    setNotification(notification.filter((n) => n !== notif));
                  }}
                >
                  {notif.chat.isGroupChat
                    ? `New Message in ${notif.chat.chatName}`
                    : `New Message from ${getSender(user, notif.chat.users).name}`}
              </div>           ))}






  </DropdownMenuContent>
</DropdownMenu>

<Dialog>
    <DropdownMenu>
  <DropdownMenuTrigger asChild>
  <Avatar>
      <AvatarImage src={getImageSrc(user!)} alt="@shadcn" />
      <AvatarFallback className="uppercase">{user?.name.slice(0,3)}</AvatarFallback>
    </Avatar>
  </DropdownMenuTrigger>
  <DropdownMenuContent >
{user&& <DropdownMenuLabel className="flex items-center gap-3">My Account    <Avatar>
      <AvatarImage src={getImageSrc(user)} alt="@shadcn" />
      <AvatarFallback className="uppercase">{user.name.slice(0,3)}</AvatarFallback>
    </Avatar>
    
    </DropdownMenuLabel>}
 
    <DropdownMenuSeparator className="bg-black" />
    <DropdownMenuItem>  
     
    </DropdownMenuItem>
   
    <DialogTrigger asChild>
    <DropdownMenuItem>Profile</DropdownMenuItem>
      </DialogTrigger>
      <DropdownMenuItem><Button variant="destructive" onClick={logout}>logout</Button></DropdownMenuItem>
    
  </DropdownMenuContent>
</DropdownMenu>
{user&&<DialogContent className="flex flex-col items-center justify-center">
    <DialogHeader>
      <DialogTitle className="text-center">Hi {user.name}</DialogTitle>
      <DialogDescription className="text-center">
 Profile pic
<div className="  object-fill overflow-hidden rounded-full size-[200px] "><img src={user.ProfilePic?getImageSrc(user):"https://github.com/shadcn.png"} className="object-fill  w-full h-full bg-center" alt="" /></div>
 <br></br>
 email:{user.email}
      </DialogDescription>
    </DialogHeader>
 
  </DialogContent>}

</Dialog>
    </div>
  
    </div>
  )
}

export default Header