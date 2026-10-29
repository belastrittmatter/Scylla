"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SettingsAccountCardProps {
  userName?: string | null;
  userEmail?: string | null;
}

export function SettingsAccountCard({
  userName,
  userEmail,
}: SettingsAccountCardProps) {
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <Card className="shadow-xs border-neutral-200/80 dark:border-neutral-800 dark:bg-neutral-900">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
            <Sparkles className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Connected Account & Calendar Sync
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Status of your Google Calendar synchronization and room scheduler.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        <div className="flex flex-col gap-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-neutral-950/40">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {userName || "Calendar User"}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {userEmail || "user@example.com"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex size-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Google Calendar & Meet Connected
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
