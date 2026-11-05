"use client";

import * as React from "react";
import { toast } from "sonner";
import { Clock, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "cn";
import { useCalendarSettings } from "@/hooks/use-calendar-settings";
import { SLOT_DURATIONS } from "@/components/settings/settings-constants";

export function SettingsCalendarFormattingCard() {
  const { settings, updateSetting } = useCalendarSettings();

  return (
    <Card className="w-full pb-0 text-start shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">
              Date & Time Formatting
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Configure time notation, week start day, and grid intervals.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 px-6 pb-6">
        {/* Time Display Format */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Time Display Format
          </Label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {[
              {
                id: "12h" as const,
                label: "12-Hour",
                desc: "e.g. 2:30 PM (AM/PM)",
              },
              {
                id: "24h" as const,
                label: "24-Hour",
                desc: "e.g. 14:30 (Military / ISO)",
              },
            ].map((fmt) => {
              const isSelected = settings.timeFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => {
                    updateSetting("timeFormat", fmt.id);
                    toast.success(`${fmt.label} format enabled`);
                  }}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-accent/50",
                  )}
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {fmt.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {fmt.desc}
                    </div>
                  </div>
                  {isSelected && <Check className="size-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* First Day of the Week */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            First Day of the Week
          </Label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {[
              {
                id: 1 as const,
                label: "Monday",
                desc: "Standard European / ISO week",
              },
              {
                id: 0 as const,
                label: "Sunday",
                desc: "Standard US / traditional week",
              },
            ].map((day) => {
              const isSelected = settings.weekStartsOn === day.id;
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => {
                    updateSetting("weekStartsOn", day.id);
                    toast.success(`Week starts on ${day.label}`);
                  }}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-accent/50",
                  )}
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {day.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {day.desc}
                    </div>
                  </div>
                  {isSelected && <Check className="size-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid Slot Duration */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Grid Slot Resolution
          </Label>
          <div className="grid grid-cols-3 gap-2.5">
            {SLOT_DURATIONS.map((slot) => {
              const isSelected = settings.slotDuration === slot.value;
              return (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => {
                    updateSetting("slotDuration", slot.value as 15 | 30 | 60);
                    toast.success(`Slot resolution: ${slot.label}`);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary font-semibold text-primary"
                      : "border-border hover:bg-accent/50 text-foreground",
                  )}
                >
                  <span className="text-sm">{slot.label}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {slot.value === 15
                      ? "High detail"
                      : slot.value === 30
                        ? "Standard"
                        : "Compact"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter className="rounded-b-xl border-t bg-sidebar !py-4 px-6 text-xs text-muted-foreground">
        <span>
          Applied immediately to the calendar gutter, event cards, and time
          indicators.
        </span>
      </CardFooter>
    </Card>
  );
}
