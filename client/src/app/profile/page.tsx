"use client";

import Link from "next/link";
import React from "react";
import { LuArrowLeft } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useChat } from "@/context/ChatProvider";
import { useWakingUp } from "@/hooks/useWakingUp";
import { Logo } from "../compontes/Logo";
import { ProfileEmailForm } from "../compontes/ProfileEmailForm";
import { ProfileNameForm } from "../compontes/ProfileNameForm";
import { ProfilePhotoForm } from "../compontes/ProfilePhotoForm";

const ProfilePage = () => {
  const { user } = useChat();
  const wakingUp = useWakingUp();

  if (!user) {
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <Logo className="animate-pulse text-2xl" />
        <p role="status" className="max-w-xs text-sm text-muted-foreground">
          {wakingUp ? "Waking the server up. This can take up to a minute." : "Loading your profile…"}
        </p>
      </main>
    );
  }

  return (
    <div className="h-dvh overflow-y-auto bg-canvas">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto flex h-16 max-w-xl items-center gap-2 px-2 sm:px-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link href="/chats" aria-label="Back to chats">
              <LuArrowLeft aria-hidden className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="font-display text-xl font-bold tracking-tight">Edit profile</h1>
        </div>
      </header>

      <main className="mx-auto max-w-xl space-y-4 px-4 py-6 sm:py-8">
        <ProfilePhotoForm user={user} />
        <ProfileNameForm user={user} />
        <ProfileEmailForm user={user} />
      </main>
    </div>
  );
};

export default ProfilePage;
