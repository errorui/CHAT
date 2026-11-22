"use client";

import axios from "axios";
import React, { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LuCamera } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/errors";
import { toAvatarFile } from "@/lib/resizeImage";
import { PasswordInput } from "./PasswordInput";

type Fields = { name: string; email: string; password: string; confirmpassword: string };
type Errors = Partial<Record<keyof Fields, string>>;

const validate = (values: Fields): Errors => {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = "Enter your name";
  if (!/^\S+@\S+$/.test(values.email.trim())) errors.email = "Enter a valid email address";
  if (!values.password) errors.password = "Choose a password";
  if (values.confirmpassword !== values.password) errors.confirmpassword = "The passwords don't match";
  return errors;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-[0.8rem] font-medium text-destructive">
      {message}
    </p>
  );
}

const SignupForm = () => {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<Fields>({ name: "", email: "", password: "", confirmpassword: "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>();
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!photo) {
      setPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const field = (name: keyof Fields) => ({
    id: name,
    name,
    value: values[name],
    onChange: handleChange,
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFailure(undefined);

    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      form.current?.querySelector<HTMLInputElement>(`#${firstInvalid}`)?.focus();
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append("name", values.name.trim());
      body.append("email", values.email.trim());
      body.append("password", values.password);
      if (photo) body.append("ProfilePic", await toAvatarFile(photo));

      await axios.post("/api/user", body);
      router.replace("/chats");
    } catch (error) {
      setFailure(errorMessage(error, "Could not create the account. Please try again."));
      setBusy(false);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    if (picker.current) picker.current.value = "";
  };

  return (
    <form ref={form} onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="flex items-center gap-4">
        <label
          htmlFor="ProfilePic"
          className="relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-input bg-muted text-muted-foreground transition-colors hover:text-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
        >
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <LuCamera aria-hidden className="h-6 w-6" />
          )}
          <span className="sr-only">Choose a profile photo</span>
          <input
            ref={picker}
            id="ProfilePic"
            name="ProfilePic"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
          />
        </label>
        <div className="min-w-0 text-sm">
          <p className="font-medium">Profile photo</p>
          {photo ? (
            <button type="button" onClick={removePhoto} className="text-primary underline-offset-4 hover:underline">
              Remove photo
            </button>
          ) : (
            <p className="text-muted-foreground">Optional</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input {...field("name")} autoComplete="name" placeholder="Your name" />
        <FieldError id="name-error" message={errors.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input {...field("email")} type="email" autoComplete="email" placeholder="you@example.com" />
        <FieldError id="email-error" message={errors.email} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput {...field("password")} autoComplete="new-password" />
        <FieldError id="password-error" message={errors.password} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmpassword">Confirm password</Label>
        <PasswordInput {...field("confirmpassword")} autoComplete="new-password" />
        <FieldError id="confirmpassword-error" message={errors.confirmpassword} />
      </div>

      {failure && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {failure}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
};

export default SignupForm;
