"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { SettingsThemeCard } from "@/components/settings/settings-theme-card";
import { SettingsCalendarViewCard } from "@/components/settings/settings-calendar-view-card";
import { SettingsCalendarFormattingCard } from "@/components/settings/settings-calendar-formatting-card";
import { SettingsWorkingHoursCard } from "@/components/settings/settings-working-hours-card";
import { SettingsCalendarOverlaysCard } from "@/components/settings/settings-calendar-overlays-card";
import { SettingsRestoreDefaultsCard } from "@/components/settings/settings-restore-defaults-card";

export function SettingsView() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 p-4 sm:p-6 lg:p-8">
      {/* Header with Title, Description, and Navigation matching Account Settings */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Calendar & Display Preferences
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Customize your schedule presentation, grid boundaries, active hours,
            and theme.
          </p>
        </div>

        <Link
          href="/account/settings"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1.5 border-neutral-200 text-xs text-neutral-700 dark:border-neutral-800 dark:text-neutral-300",
          )}
        >
          Account Settings
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="space-y-8">
        {/* Appearance Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Appearance
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Choose how Scylla looks on your screen. Supports automatic
              synchronization with your system settings.
            </p>
          </div>
          <SettingsThemeCard />
        </section>

        {/* Calendar Display Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Calendar Display
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Configure grid layouts, time formats, working hours, and overlays.
            </p>
          </div>

          <div className="space-y-4">
            <SettingsCalendarViewCard />
            <SettingsCalendarFormattingCard />
            <SettingsWorkingHoursCard />
            <SettingsCalendarOverlaysCard />
          </div>
        </section>

        {/* Reset Preferences Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Reset Preferences
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Restore all calendar display preferences and theme to system
              defaults.
            </p>
          </div>
          <SettingsRestoreDefaultsCard />
        </section>
      </div>
    </div>
  );
}
