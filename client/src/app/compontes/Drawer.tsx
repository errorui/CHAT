import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetOverlay
} from "@/components/ui/sheet"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"
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

  
import { useState } from "react"
import { CiSearch } from "react-icons/ci";
import { FaRegBell,FaAngleDown,FaRegUser  } from "react-icons/fa";
import { useChat } from "@/context/ChatProvider"
import axios from 'axios';

type User= {
    _id: string;
    name: string;
    email: string;
    ProfilePic: string;
    isAdmin: boolean;
    createdAt: string;
    updatedAt: string;
  }

import { Card } from "@/components/ui/card"
import UserListItem from "./UserListItem"
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@radix-ui/react-toast"

import { Chat } from "../type"
const API_URL = 'http://localhost:5000';


export function Drawer() {
  const {
    setSelectedChat,
    user,
    notification,
    setNotification,
    chats,
    setChats,
  } = useChat();
  const { toast } = useToast()
    const [search,setsearch]=useState("")
    const [searchresults,setsearchresults]=useState<User[]>([])
    let [loading,setloading]=useState(false)
    let [loadingChat,setloadingChat]=useState(false)
    const handleSearch=async()=>{
      
        try {
           setloading(true)
         let {data}=  await axios.get(`${API_URL}/api/user?search=${search}`,  { withCredentials: true });
         console.log(data)
         
        //  data as User[]
         setsearchresults(data);
           setloading(false);
        } catch (error) {
          toast({
            variant: "destructive",
            title: "something went wrong",
            action: <ToastAction altText="Try again">Try different email</ToastAction>,
           
          })
        }
   }
   const accessChat=async(userId:string)=>{
    try {
      setloadingChat(true)
      let {data}=  await axios.post(`${API_URL}/api/chat`,{userId}  ,{ withCredentials: true });
      console.log(data)
      if(!chats.find((c:any)=>data._id===c._id)){
        setChats([...chats,data])
      }
      setSelectedChat(data)
      setloadingChat(false)
    } catch (error) {
      
    }
   }
  return (
   
          <Sheet  >
         <TooltipProvider>
         <Tooltip>
         <TooltipTrigger asChild>
            <SheetTrigger asChild>

        <Button variant="default" className="flex items-center justify-center"><CiSearch className="mr-2" />Open</Button>
      </SheetTrigger>
      </TooltipTrigger>
      <TooltipContent>
          <p>search chats</p>
        </TooltipContent>
      </Tooltip>
      </TooltipProvider>
      
      <SheetContent side="left" >
        
        <SheetHeader>
          <SheetTitle>search user</SheetTitle>
        
        </SheetHeader>
        <div className="flex gap-3">
        <div>
        <Input value={search} onChange={(e)=>setsearch(e.target.value)}  placeholder="serach user"></Input>
       </div>
        <SheetFooter>
          
            <Button onClick={handleSearch}>Search</Button>
         
        </SheetFooter>

        </div>
        <div className="mt-8 ">
        {loadingChat&&<h1 className="text-3xl">loading</h1>}
          {
            loading?<h1>loading</h1>:
            searchresults&&(
                searchresults.map((i:User,index)=>{
                    return (
                       <UserListItem i={i} handlefunction={()=>accessChat(i._id)}></UserListItem>
                    )
                })
            )
            }
          
            </div>
         
      </SheetContent>
    </Sheet>
   
  

  
  )
}
