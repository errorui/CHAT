import React from 'react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { AvatarImage } from "@radix-ui/react-avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
const ProfileModal = ({user}:{user:any}) => {
    const getImageSrc = (user:any) => {
        const mimeType ="image/jpeg";
        return `data:${mimeType};base64,${user.ProfilePic}`;
      };
  return (
    <Dialog>
 <DialogTrigger asChild>
 <Avatar className="mr-2">
        <AvatarImage src={getImageSrc(user)} alt="@shadcn" />
        <AvatarFallback className="uppercase">
          {user.name.slice(0, 3)}
        </AvatarFallback>
      </Avatar>
      </DialogTrigger>
<DialogContent className="flex flex-col items-center justify-center">
    <DialogHeader>
      <DialogTitle className="text-center">{user.name}</DialogTitle>
      <DialogDescription className="text-center">
 Profile pic
 <div className="  object-fill overflow-hidden rounded-full size-[200px] "><img src={user.ProfilePic?getImageSrc(user):"https://github.com/shadcn.png"} className="object-fill  w-full h-full bg-center" alt="" /></div>
 <br></br>
 email:{user.email}
      </DialogDescription>
    </DialogHeader>
 
  </DialogContent>
    </Dialog>
  )
}

export default ProfileModal