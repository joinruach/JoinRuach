"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-10 w-10 rounded-full bg-white/10" aria-hidden="true" />
    );
  }

  const handleToggle = () => {
    // Cycle through: dark → light → system → dark
    if (theme === "dark") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("system");
    } else {
      setTheme("dark");
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 dark:bg-white/10 dark:hover:bg-white/20"
      aria-label={`Switch to ${theme === "dark" ? "light" : theme === "light" ? "system" : "dark"} mode`}
      title={`Theme: ${theme === "system" ? `System (${resolvedTheme})` : theme}`}
    >
      {/* Sun icon (light mode) */}
      <svg
        className={`absolute h-5 w-5 transition-all ${
          resolvedTheme === "light"
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-0 opacity-0"
        }`}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>

      {/* Moon icon (dark mode) */}
      <svg
        className={`absolute h-5 w-5 transition-all ${
          resolvedTheme === "dark"
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        }`}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>

      {/* System preference indicator (small dot) */}
      {theme === "system" && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-400" />
      )}
    </button>
  );
}
