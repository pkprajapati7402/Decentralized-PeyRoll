'use client';

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
        theme === "dark"
          ? "border-purple-500/20 bg-[#14141F] hover:bg-[#1c1c29] text-white"
          : " bg-white text-black"
      }`}
    >
      <Sun className={`h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0 ${theme === "light" ? "text-black" : ""}`} />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}