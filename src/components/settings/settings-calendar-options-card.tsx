"use client";

import * as React from "react";
import { Clock, Layers, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { CalendarSettings } from "@/hooks/use-calendar-settings";
import {
  START_HOURS,
  END_HOURS,
  SLOT_DURATIONS,
} from "@/components/settings/settings-constants";

interface SettingsCalendarOptionsCardProps {
  settings: CalendarSettings;
  updateSetting: <K extends keyof CalendarSettings>(
    key: K,
    value: CalendarSettings[K],
  ) => void;
}

export function SettingsCalendarOptionsCard({
  settings,
  updateSetting,
}: SettingsCalendarOptionsCardProps) {
  return (
    <Card className="shadow-xs border-neutral-200/80 dark:border-neutral-800 dark:bg-neutral-900">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
            <Clock className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Hours & Grid Density
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
              Configure working hours, slot resolution, weekends, and real-time
              indicators.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        {/* Working Hours Range */}
        <div className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                <Clock className="size-4 text-orange-500" />
                Active Working Hours Range
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Controls the start and end hours rendered on the time-grid
                schedule view.
              </p>
            </div>
            <Badge
              variant="outline"
              className="w-fit border-orange-200 bg-orange-50/50 text-xs text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300"
            >
              {settings.dayEndHour - settings.dayStartHour} hours visible span
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Day Starts At
              </span>
              <select
                value={settings.dayStartHour}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= settings.dayEndHour) {
                    toast.error("Start hour must be before end hour");
                    return;
                  }
                  updateSetting("dayStartHour", val);
                  toast.success(`Day start hour updated`);
                }}
                aria-label="Day Starts At"
                className="shadow-2xs focus:outline-hidden w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 transition-colors focus:border-orange-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
              >
                {START_HOURS.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Day Ends At
              </span>
              <select
                value={settings.dayEndHour}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val <= settings.dayStartHour) {
                    toast.error("End hour must be after start hour");
                    return;
                  }
                  updateSetting("dayEndHour", val);
                  toast.success(`Day end hour updated`);
                }}
                aria-label="Day Ends At"
                className="shadow-2xs focus:outline-hidden w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 transition-colors focus:border-orange-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
              >
                {END_HOURS.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-100 dark:border-neutral-800/80" />

        {/* Slot Duration */}
        <div className="space-y-3">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              <Layers className="size-4 text-orange-500" />
              Time Slot Grid Density
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Snap precision when dragging across slots or creating new events
              on the grid.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {SLOT_DURATIONS.map((slot) => {
              const isSelected = settings.slotDuration === slot.value;
              return (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => {
                    updateSetting("slotDuration", slot.value);
                    toast.success(`Slot duration set to ${slot.label}`);
                  }}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? "border-orange-600 bg-orange-50/20 ring-1 ring-orange-500 dark:border-orange-500 dark:bg-orange-950/20"
                      : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {slot.label}
                    </span>
                    {isSelected && (
                      <Check className="size-3.5 text-orange-600 dark:text-orange-400" />
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    {slot.sub}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-neutral-100 dark:border-neutral-800/80" />

        {/* Toggles: Show Weekends & Current Time Indicator */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                Show Weekends
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Display Saturday and Sunday columns on week and month views.
              </p>
            </div>
            <Switch
              checked={settings.showWeekends}
              onCheckedChange={(checked) => {
                updateSetting("showWeekends", checked);
                toast.success(
                  checked ? "Weekends displayed" : "Weekends hidden",
                );
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                Current Time Indicator
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Renders a dynamic orange timeline marker displaying current time
                on today&apos;s grid.
              </p>
            </div>
            <Switch
              checked={settings.showNowIndicator}
              onCheckedChange={(checked) => {
                updateSetting("showNowIndicator", checked);
                toast.success(
                  checked
                    ? "Current time indicator enabled"
                    : "Current time indicator disabled",
                );
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
