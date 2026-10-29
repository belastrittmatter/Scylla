"use client";

import * as React from "react";
import { CalendarDays, CalendarRange, Clock, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import type { CalendarSettings } from "@/hooks/use-calendar-settings";
import { CALENDAR_VIEWS } from "@/components/settings/settings-constants";

interface SettingsCalendarViewsCardProps {
  settings: CalendarSettings;
  updateSetting: <K extends keyof CalendarSettings>(
    key: K,
    value: CalendarSettings[K],
  ) => void;
}

export function SettingsCalendarViewsCard({
  settings,
  updateSetting,
}: SettingsCalendarViewsCardProps) {
  return (
    <Card className="shadow-xs border-neutral-200/80 dark:border-neutral-800 dark:bg-neutral-900">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
            <CalendarDays className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Default Calendar View
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Choose the primary view mode displayed when opening your calendar.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CALENDAR_VIEWS.map((v) => {
            const Icon = v.icon;
            const isSelected = settings.defaultView === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  updateSetting("defaultView", v.id);
                  toast.success(`Default view set to ${v.title}`);
                }}
                className={`group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all hover:border-neutral-400 dark:hover:border-neutral-600 ${
                  isSelected
                    ? "border-orange-600 bg-orange-50/20 ring-2 ring-orange-500/20 dark:border-orange-500 dark:bg-orange-950/20"
                    : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex size-8 items-center justify-center rounded-lg ${
                      isSelected
                        ? "bg-orange-600 text-white"
                        : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                  {isSelected && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-orange-600 text-white">
                      <Check className="size-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {v.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {v.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-neutral-100 dark:border-neutral-800/80" />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Start day of the week */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-800 dark:text-neutral-200">
              <CalendarRange className="size-4 text-neutral-500" />
              First Day of the Week
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Determines which column starts the week in week and month grids.
            </p>
            <div className="inline-flex w-full rounded-lg border border-neutral-200 bg-neutral-50 p-1 sm:w-auto dark:border-neutral-800 dark:bg-neutral-950/60">
              <button
                type="button"
                onClick={() => {
                  updateSetting("weekStartsOn", 1);
                  toast.success("Week starts on Monday");
                }}
                className={`flex-1 rounded-md px-4 py-1.5 text-xs font-semibold transition-all sm:flex-initial ${
                  settings.weekStartsOn === 1
                    ? "shadow-2xs bg-white text-neutral-900 dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                Monday (Thứ Hai)
              </button>
              <button
                type="button"
                onClick={() => {
                  updateSetting("weekStartsOn", 0);
                  toast.success("Week starts on Sunday");
                }}
                className={`flex-1 rounded-md px-4 py-1.5 text-xs font-semibold transition-all sm:flex-initial ${
                  settings.weekStartsOn === 0
                    ? "shadow-2xs bg-white text-neutral-900 dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                Sunday (Chủ Nhật)
              </button>
            </div>
          </div>

          {/* Time format: 12h vs 24h */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-800 dark:text-neutral-200">
              <Clock className="size-4 text-neutral-500" />
              Time Display Format
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Choose between 12-hour (AM/PM) or standard 24-hour notation.
            </p>
            <div className="inline-flex w-full rounded-lg border border-neutral-200 bg-neutral-50 p-1 sm:w-auto dark:border-neutral-800 dark:bg-neutral-950/60">
              <button
                type="button"
                onClick={() => {
                  updateSetting("timeFormat", "12h");
                  toast.success("Time format set to 12-hour AM/PM");
                }}
                className={`flex-1 rounded-md px-4 py-1.5 text-xs font-semibold transition-all sm:flex-initial ${
                  settings.timeFormat === "12h"
                    ? "shadow-2xs bg-white text-neutral-900 dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                12-hour (e.g. 2:30 PM)
              </button>
              <button
                type="button"
                onClick={() => {
                  updateSetting("timeFormat", "24h");
                  toast.success("Time format set to 24-hour");
                }}
                className={`flex-1 rounded-md px-4 py-1.5 text-xs font-semibold transition-all sm:flex-initial ${
                  settings.timeFormat === "24h"
                    ? "shadow-2xs bg-white text-neutral-900 dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                24-hour (e.g. 14:30)
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
