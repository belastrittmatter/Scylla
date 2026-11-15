"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function LandingThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* Icons swap via the html.dark class — no state, hydration-safe */}
      <Sun className="size-4 hidden dark:block" aria-hidden="true" />
      <Moon className="size-4 block dark:hidden" aria-hidden="true" />
    </button>
  );
}
