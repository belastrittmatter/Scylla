"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Repeat } from "lucide-react";

export type RepeatFrequency =
  "none" | "daily_workdays" | "daily_all" | "weekly";

interface CalendarRepeatOptionsProps {
  frequency: RepeatFrequency;
  onChange: (freq: RepeatFrequency) => void;
  disabled?: boolean;
}

export function CalendarRepeatOptions({
  frequency,
  onChange,
  disabled,
}: CalendarRepeatOptionsProps) {
  const isRepeating = frequency !== "none";

  return (
    <div className="space-y-2 rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-2.5 dark:border-neutral-800 dark:bg-neutral-900/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="size-3.5 text-neutral-500" />
          <Label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Repeat Meeting
          </Label>
        </div>
        <Button
          type="button"
          variant={isRepeating ? "default" : "outline"}
          size="sm"
          disabled={disabled}
          onClick={() => onChange(isRepeating ? "none" : "daily_workdays")}
          className="h-7 cursor-pointer px-2 text-[11px]"
        >
          {isRepeating ? "Repeating On" : "Does Not Repeat"}
        </Button>
      </div>

      {isRepeating && (
        <div className="pt-1">
          <Select
            value={frequency}
            onValueChange={(val) => onChange(val as RepeatFrequency)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select repeat schedule..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily_workdays">
                Every Workday for 1 Week (Monday – Friday, 5 days)
              </SelectItem>
              <SelectItem value="daily_all">
                Every Day for 1 Week (7 days)
              </SelectItem>
              <SelectItem value="weekly">
                Weekly on this day (4 weeks)
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-1 text-[10px] text-neutral-500">
            {frequency === "daily_workdays" &&
              "Will schedule 5 daily sync events at this time for Monday through Friday."}
            {frequency === "daily_all" &&
              "Will schedule 7 daily events at this time for consecutive days."}
            {frequency === "weekly" &&
              "Will schedule 4 weekly recurring events on this day of the week."}
          </p>
        </div>
      )}
    </div>
  );
}
