"use client";

import * as React from "react";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsThemeCardProps {
  theme: string | undefined;
  mounted: boolean;
  onThemeChange: (theme: "light" | "dark" | "system") => void;
}

export function SettingsThemeCard({ theme, mounted, onThemeChange }: SettingsThemeCardProps) {
  return (
    <Card className="shadow-xs border-neutral-200/80 dark:border-neutral-800 dark:bg-neutral-900">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
            <Sun className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Appearance & Theme
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Choose how Scylla looks on your screen. Supports automatic synchronization with your
              system settings.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {mounted ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Light Mode */}
            <button
              type="button"
              onClick={() => onThemeChange("light")}
              className={`group relative flex flex-col items-center rounded-xl border-2 p-4 text-left transition-all hover:border-neutral-400 dark:hover:border-neutral-600 ${
                theme === "light"
                  ? "shadow-xs border-orange-600 bg-orange-50/20 dark:border-orange-500"
                  : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/60"
              }`}
            >
              {theme === "light" && (
                <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-orange-600 text-white">
                  <Check className="size-3 stroke-[3]" />
                </span>
              )}
              <div className="shadow-2xs flex h-24 w-full flex-col justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-red-400" />
                  <div className="size-2 rounded-full bg-amber-400" />
                  <div className="size-2 rounded-full bg-emerald-400" />
                  <div className="ml-1 h-2 w-12 rounded bg-neutral-200" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2.5 w-3/4 rounded bg-neutral-300" />
                  <div className="h-2 w-1/2 rounded bg-neutral-200" />
                </div>
                <div className="h-3 w-16 rounded bg-orange-500/80" />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Sun className="size-4 text-amber-500" />
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Light Mode
                </span>
              </div>
              <span className="mt-0.5 text-center text-xs text-neutral-500 dark:text-neutral-400">
                Clean crisp high-contrast layout
              </span>
            </button>

            {/* Dark Mode */}
            <button
              type="button"
              onClick={() => onThemeChange("dark")}
              className={`group relative flex flex-col items-center rounded-xl border-2 p-4 text-left transition-all hover:border-neutral-400 dark:hover:border-neutral-600 ${
                theme === "dark"
                  ? "shadow-xs border-orange-600 bg-orange-50/10 dark:border-orange-500 dark:bg-orange-950/20"
                  : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/60"
              }`}
            >
              {theme === "dark" && (
                <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-orange-600 text-white">
                  <Check className="size-3 stroke-[3]" />
                </span>
              )}
              <div className="shadow-2xs flex h-24 w-full flex-col justify-between rounded-lg border border-neutral-700 bg-neutral-950 p-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-red-500/80" />
                  <div className="size-2 rounded-full bg-amber-500/80" />
                  <div className="size-2 rounded-full bg-emerald-500/80" />
                  <div className="ml-1 h-2 w-12 rounded bg-neutral-800" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2.5 w-3/4 rounded bg-neutral-800" />
                  <div className="h-2 w-1/2 rounded bg-neutral-800/80" />
                </div>
                <div className="h-3 w-16 rounded bg-orange-500/80" />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Moon className="size-4 text-indigo-400" />
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Dark Mode
                </span>
              </div>
              <span className="mt-0.5 text-center text-xs text-neutral-500 dark:text-neutral-400">
                Easy on the eyes in low-light
              </span>
            </button>

            {/* System Preference */}
            <button
              type="button"
              onClick={() => onThemeChange("system")}
              className={`group relative flex flex-col items-center rounded-xl border-2 p-4 text-left transition-all hover:border-neutral-400 dark:hover:border-neutral-600 ${
                theme === "system"
                  ? "shadow-xs border-orange-600 bg-orange-50/10 dark:border-orange-500"
                  : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/60"
              }`}
            >
              {theme === "system" && (
                <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-orange-600 text-white">
                  <Check className="size-3 stroke-[3]" />
                </span>
              )}
              <div className="shadow-2xs flex h-24 w-full overflow-hidden rounded-lg border border-neutral-300 dark:border-neutral-700">
                <div className="flex w-1/2 flex-col justify-between bg-neutral-50 p-2">
                  <div className="size-2 rounded-full bg-neutral-300" />
                  <div className="h-2 w-full rounded bg-neutral-200" />
                  <div className="h-2 w-8 rounded bg-orange-500" />
                </div>
                <div className="flex w-1/2 flex-col justify-between border-l border-neutral-200 bg-neutral-950 p-2 dark:border-neutral-800">
                  <div className="ml-auto size-2 rounded-full bg-neutral-700" />
                  <div className="h-2 w-full rounded bg-neutral-800" />
                  <div className="ml-auto h-2 w-8 rounded bg-orange-500" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Laptop className="size-4 text-neutral-600 dark:text-neutral-300" />
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  System
                </span>
              </div>
              <span className="mt-0.5 text-center text-xs text-neutral-500 dark:text-neutral-400">
                Follows your operating system
              </span>
            </button>
          </div>
        ) : (
          <div className="h-36 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
        )}
      </CardContent>
    </Card>
  );
}
