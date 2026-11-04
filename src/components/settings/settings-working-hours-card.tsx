"use client";

import * as React from "react";
import { toast } from "sonner";
import { Briefcase } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  useCalendarSettings,
  workingHoursSchema,
} from "@/hooks/use-calendar-settings";
import {
  START_HOURS,
  END_HOURS,
} from "@/components/settings/settings-constants";

export function SettingsWorkingHoursCard() {
  const { settings, updateSetting } = useCalendarSettings();

  const handleStartHourChange = (val: string | null) => {
    if (!val) return;
    const hour = Number(val);
    const parsed = workingHoursSchema.safeParse({
      dayStartHour: hour,
      dayEndHour: settings.dayEndHour,
    });
    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message || "Start hour must be before end hour",
      );
      return;
    }
    updateSetting("dayStartHour", hour);
    toast.success("Start hour updated");
  };

  const handleEndHourChange = (val: string | null) => {
    if (!val) return;
    const hour = Number(val);
    const parsed = workingHoursSchema.safeParse({
      dayStartHour: settings.dayStartHour,
      dayEndHour: hour,
    });
    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message || "End hour must be after start hour",
      );
      return;
    }
    updateSetting("dayEndHour", hour);
    toast.success("End hour updated");
  };

  const currentStartHourLabel =
    START_HOURS.find((h) => h.value === settings.dayStartHour)?.label ||
    `${settings.dayStartHour}:00`;
  const currentEndHourLabel =
    END_HOURS.find((h) => h.value === settings.dayEndHour)?.label ||
    `${settings.dayEndHour}:00`;

  return (
    <Card className="w-full gap-6 pt-6 pb-0 text-start shadow-xs">
      <CardHeader className="gap-1.5 px-6">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold md:text-xl">
          <Briefcase className="size-5 text-muted-foreground" />
          Working Hours Window
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground md:text-sm">
          Set your schedule boundaries for availability planning.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="day-start"
              className="text-xs text-muted-foreground"
            >
              Day Starts At
            </Label>
            <Select
              value={String(settings.dayStartHour)}
              onValueChange={handleStartHourChange}
            >
              <SelectTrigger id="day-start" className="w-full">
                <SelectValue>{currentStartHourLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {START_HOURS.map((h) => (
                  <SelectItem key={h.value} value={String(h.value)}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="day-end" className="text-xs text-muted-foreground">
              Day Ends At
            </Label>
            <Select
              value={String(settings.dayEndHour)}
              onValueChange={handleEndHourChange}
            >
              <SelectTrigger id="day-end" className="w-full">
                <SelectValue>{currentEndHourLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {END_HOURS.map((h) => (
                  <SelectItem key={h.value} value={String(h.value)}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="rounded-b-xl border-t bg-sidebar !py-4 px-6 text-xs text-muted-foreground">
        <span>
          Validated with Zod: Start hour must be strictly before end hour.
        </span>
      </CardFooter>
    </Card>
  );
}
