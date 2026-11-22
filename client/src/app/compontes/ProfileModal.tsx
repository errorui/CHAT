import { avatarSrc } from '@/lib/avatar';
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
  return (
    <Dialog>
 <DialogTrigger asChild>
 <Avatar className="mr-2">
        <AvatarImage src={avatarSrc(user)} alt="@shadcn" />
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
 <Avatar className="size-[200px]"><AvatarImage src={avatarSrc(user)} alt="" /><AvatarFallback>{user.name.slice(0, 3)}</AvatarFallback></Avatar>
 <br></br>
 email:{user.email}
      </DialogDescription>
    </DialogHeader>
 
  </DialogContent>
    </Dialog>
  )
}

export default ProfileModal