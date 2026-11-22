"use client"

import React from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";

import { useToast } from '@/components/ui/use-toast'
import { ToastAction } from '@/components/ui/toast'
import axios from "axios";
import { useRouter } from 'next/navigation'



 const formSchema = z.object({
    email: z.string().min(2, {
      message: "enter login",
    }).email("Invalid email"),
    password: z.string()
  });
const LoginUser = async (credentials: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post(`/api/user/login`, credentials,{
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials:true
      } );
  
  
      return response.data;
    } catch (error: any) {
      let status = error?.response?.status;
      console.log(error)
      if (status === 400) {
        
        return "Invalid email";
      } else if(status===401) {
        return "Invalid credentials";
      }
      else{
        return "server error"
      }
    }
  };
const LoginForm = () => {
  const router=useRouter();
  const { toast } = useToast()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", password: "" },
       
      })
      async function onSubmit(values: z.infer<typeof formSchema>) {
       
        let result=await LoginUser(values);
        // every failure comes back as a string
        if(typeof result==="string"){
          toast({
            variant: "destructive",
            title: result,
           
          })
   
        }
        else{
          toast({
            title: "user login succesfully",
            action: <ToastAction altText="Try again">X</ToastAction>,
          })
          router.push('/chats')
        }
        
        
      };
  return (
  

      
        <>
        <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className=" w-full">
        <div className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel >email</FormLabel>
              <FormControl>
                <Input placeholder="email" {...field} />
              </FormControl>
             
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" placeholder="password" {...field} />
              </FormControl>
             
              <FormMessage />
            </FormItem>
          )}
        />
        </div>
       
   
        
        <Button className="w-full mt-8 " type="submit">sign in</Button>
      </form>
    </Form>
        </>
       
   
  )
}

export default LoginForm