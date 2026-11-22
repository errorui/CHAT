"use client";

import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { LuCamera } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useChat } from "@/context/ChatProvider";
import { avatarSrc } from "@/lib/avatar";
import { toAvatarFile } from "@/lib/resizeImage";
import { ProfileSection, SaveStatus, useSave } from "./ProfileSection";
import { UserAvatar } from "./UserAvatar";
import { User } from "../type";

export function ProfilePhotoForm({ user }: { user: User }) {
  const { updateUser } = useChat();
  const { busy, status, setStatus, save } = useSave();
  const picker = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>();
  const [hasPhoto, setHasPhoto] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const current = avatarSrc(user);

  useEffect(() => {
    if (!file) {
      setPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // only offer "Remove" when there is a picture
  useEffect(() => {
    setHasPhoto(false);
    if (!current) return;
    const image = new Image();
    image.onload = () => setHasPhoto(true);
    image.src = current;
    return () => {
      image.onload = null;
    };
  }, [current]);

  const choose = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    setConfirming(false);
    setStatus(null);
    event.target.value = ""; // so the same file can be picked again
  };

  const upload = () =>
    save("Photo saved.", async () => {
      if (!file) return;
      const body = new FormData();
      body.append("ProfilePic", await toAvatarFile(file));
      const { data } = await axios.put<User>("/api/user/user/avatar", body);
      updateUser(data);
      setFile(null);
    });

  const remove = () =>
    save("Photo removed.", async () => {
      const { data } = await axios.delete<User>("/api/user/user/avatar");
      updateUser(data);
      setConfirming(false);
    });

  return (
    <ProfileSection title="Photo">
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        {preview ? (
          <img src={preview} alt="New photo preview" className="h-28 w-28 shrink-0 rounded-full object-cover" />
        ) : (
          <UserAvatar user={user} size="lg" />
        )}

        <div className="min-w-0 space-y-3 text-center sm:text-left">
          <input ref={picker} type="file" accept="image/*" aria-label="Profile photo" className="hidden" onChange={choose} />
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            {file ? (
              <>
                <Button onClick={upload} disabled={busy}>
                  {busy ? "Uploading…" : "Save photo"}
                </Button>
                <Button variant="ghost" onClick={() => setFile(null)} disabled={busy}>
                  Cancel
                </Button>
              </>
            ) : confirming ? (
              <>
                <Button variant="destructive" onClick={remove} disabled={busy}>
                  {busy ? "Removing…" : "Remove photo"}
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
                  Keep it
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" className="gap-2" onClick={() => picker.current?.click()}>
                  <LuCamera aria-hidden />
                  {hasPhoto ? "Change photo" : "Upload photo"}
                </Button>
                {hasPhoto && (
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirming(true)}
                  >
                    Remove
                  </Button>
                )}
              </>
            )}
          </div>
          <SaveStatus status={status} />
        </div>
      </div>
    </ProfileSection>
  );
}
