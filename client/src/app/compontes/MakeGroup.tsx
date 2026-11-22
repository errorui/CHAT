"use client"
import React, { useRef, useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axios from 'axios';
import { useChat } from '@/context/ChatProvider'
import UserListItem from './UserListItem'
import { User } from '../type'
const MakeGroup = () => {
    const [search,setsearch]=useState("")
    const[searchresults,setsearchresults]=useState([]);
    const [groupUsers,setgroupUsers]=useState<User[]>([])
    const [groupChatName, setGroupChatName] = useState("");
    const [open, setOpen] = useState(false);
    const latestSearch = useRef(0);
    const {chats,
        setChats,user}=useChat()


    const handleGroup=(userToAdd:any)=>{
        if(groupUsers.some((u)=>u._id===userToAdd._id)){
        alert("user already added")
        return;
        }
        setgroupUsers([...groupUsers,userToAdd])
    }
    const handleSearch=async(query:string)=>{
        setsearch(query)
        const request=++latestSearch.current
        if(query===""){
            setsearchresults([]);
            return;
        }
        try {
          
         let {data}=  await axios.get(`/api/user?search=${encodeURIComponent(query)}`,  { withCredentials: true });
         if(request===latestSearch.current) setsearchresults(data);
           
        } catch (error) {
           alert("something went wrong")
        }
   }
   const handleDelete=(deluser:any)=>{
     setgroupUsers(groupUsers.filter((s:any)=>s._id !==deluser._id))
   }
   const handleSubmit=async()=>{
    if(!groupChatName.trim()||groupUsers.length<2){
        alert("Enter a name and pick at least 2 people")
        return;
    }
    try {
        const { data } = await axios.post(
            `/api/chat/group`,
            {
              name: groupChatName,
              users: JSON.stringify(groupUsers.map((u:any) => u._id)),
            },
            {
                withCredentials:true
            }
          );
          // the socket refresh may have added it already
          setChats((list)=>[data,...list.filter((chat)=>chat._id!==data._id)])
          setOpen(false)
          setGroupChatName("")
          setgroupUsers([])
          setsearch("")
          setsearchresults([])
    } catch (error) {
        alert("something went wrong")
    }
   }
  return (
    <Dialog open={open} onOpenChange={setOpen} >
    <DialogTrigger asChild>
      <Button variant="outline">Add</Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>make group chat</DialogTitle>
       
      </DialogHeader>
      <div className="flex flex-wrap">
        {groupUsers&&
            groupUsers.map((u:any)=>(
            <Badge onClick={()=>handleDelete(u)}  className='mr-3' key={u._id}>{u.name}</Badge>))
        }
      </div>
    <div className="">
    <Label htmlFor="groupname" className="text-right">
            GroupName
          </Label>
          <Input
            id="groupname"
             value={groupChatName}
             onChange={(e:any)=>{
                setGroupChatName(e.target.value)
             }}
            className="col-span-3"
            
          />
    </div>
        <div className="">
          <Label htmlFor="name" className="text-right">
            User
          </Label>
          <Input
            id="name"
             value={search}
             onChange={(e)=>{
                handleSearch(e.target.value)
             }}
            className="col-span-3"
            
          />
          <div className='mt-6'>
          {searchresults&&searchresults.map((i)=>[
            <UserListItem i={i} handlefunction={()=>handleGroup(i)}></UserListItem>
          ])}
          </div>
         
        </div>
       
     
      <DialogFooter>
        <Button type="submit" onClick={handleSubmit}>Save changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  )
}

export default MakeGroup