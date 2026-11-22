"use client";

import axios from "axios";
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/errors";
import { PasswordInput } from "./PasswordInput";

const formSchema = z.object({
  // not z.email(): its stricter rules could lock out accounts that already exist
  email: z.string().trim().min(1, "Enter your email").regex(/^\S+@\S+$/, "Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

const LoginForm = () => {
  const router = useRouter();
  const [failure, setFailure] = useState<string>();
  const [done, setDone] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setFailure(undefined);
    try {
      await axios.post("/api/user/login", values);
      setDone(true);
      router.replace("/chats");
    } catch (error) {
      setFailure(
        axios.isAxiosError(error) && error.response?.status === 401
          ? "That email and password don't match."
          : errorMessage(error)
      );
    }
  };

  const busy = form.formState.isSubmitting || done;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {failure && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {failure}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Form>
  );
};

export default LoginForm;
