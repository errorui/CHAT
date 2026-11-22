import { avatarSrc } from '@/lib/avatar';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { AvatarImage } from "@radix-ui/react-avatar";
import React from "react";
import { User } from "../type";
const UserListItem = ({i,handlefunction}:{
handlefunction?:()=>void
i:User
}) => {
 
  return (
    <Card onClick={handlefunction}  className="py-4 px-2 flex items-center hover:bg-slate-950 hover:text-white  ">
      <Avatar className="mr-2">
        <AvatarImage src={avatarSrc(i)} alt="@shadcn" />
        <AvatarFallback className="uppercase">
          {i.name.slice(0, 3)}
        </AvatarFallback>
      </Avatar>

      <div>
        <h1 className="uppercase font-bold">{i.name}</h1>
        <h2 className="uppercase font-light">{i.email}</h2>
      </div>
    </Card>
  );
};

export default UserListItem;
