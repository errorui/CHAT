"use client";

import { useState } from "react";
import { LuMoon, LuSun } from "react-icons/lu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { THEME_KEY } from "@/lib/theme";

// only rendered inside an open menu, so document always exists here
export function ThemeMenuItem() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    setDark(next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      // storage can be blocked, the choice then lasts until reload
    }
  };

  return (
    <DropdownMenuItem
      className="gap-2 py-2"
      onSelect={(event) => {
        event.preventDefault();
        toggle();
      }}
    >
      {dark ? <LuSun aria-hidden /> : <LuMoon aria-hidden />}
      {dark ? "Light mode" : "Dark mode"}
    </DropdownMenuItem>
  );
}
