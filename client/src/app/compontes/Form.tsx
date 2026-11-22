"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChat } from "@/context/ChatProvider";
import LoginForm from "./loginForm";
import SignupForm from "./SignupForm";

const ChatForm = () => {
  const { user, session } = useChat();
  const router = useRouter();
  const [tab, setTab] = useState("login");

  useEffect(() => {
    if (user) router.replace("/chats");
  }, [user, router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {tab === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {tab === "login" ? "Sign in to pick up where you left off." : "It takes less than a minute."}
        </p>
      </div>

      {session === "unreachable" && (
        <p role="status" className="rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
          Waking the server up. The first request can take up to a minute.
        </p>
      )}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Create account</TabsTrigger>
        </TabsList>
        <TabsContent value="login" className="mt-6">
          <LoginForm />
        </TabsContent>
        <TabsContent value="signup" className="mt-6">
          <SignupForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatForm;
