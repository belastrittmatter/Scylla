"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { RotateCcw, ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { useCalendarSettings } from "@/hooks/use-calendar-settings";
import { useSession } from "@/lib/auth-client";
import { SettingsThemeCard } from "@/components/settings/settings-theme-card";
import { SettingsCalendarViewsCard } from "@/components/settings/settings-calendar-views-card";
import { SettingsCalendarOptionsCard } from "@/components/settings/settings-calendar-options-card";
import { SettingsAccountCard } from "@/components/settings/settings-account-card";

const emptySubscribe = () => () => {};

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const { data: session } = useSession();
  const { settings, updateSetting, resetToDefaults } = useCalendarSettings();

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    toast.success(
      `Theme switched to ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode`,
    );
  };

  const handleReset = () => {
    resetToDefaults();
    setTheme("system");
    toast.info("Settings reset to defaults");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header with Title, Description, and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Calendar & Display Settings
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Customize your schedule presentation, grid boundaries, active hours,
            and theme preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/calendar"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 border-neutral-200 text-xs text-neutral-700 dark:border-neutral-800 dark:text-neutral-300",
            )}
          >
            Go to Calendar
            <ArrowRight className="size-3.5" />
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <RotateCcw className="size-3.5" />
            Reset Defaults
          </Button>
        </div>
      </div>

      {/* SECTION 1: Theme & Appearance */}
      <SettingsThemeCard
        theme={theme}
        mounted={mounted}
        onThemeChange={handleThemeChange}
      />

      {/* SECTION 2: Calendar View Preferences */}
      <SettingsCalendarViewsCard
        settings={settings}
        updateSetting={updateSetting}
      />

      {/* SECTION 3: Calendar Display & Working Hours Options */}
      <SettingsCalendarOptionsCard
        settings={settings}
        updateSetting={updateSetting}
      />

      {/* SECTION 4: Account & Connected Integrations */}
      <SettingsAccountCard
        userName={session?.user?.name}
        userEmail={session?.user?.email}
      />
    </div>
  );
}
