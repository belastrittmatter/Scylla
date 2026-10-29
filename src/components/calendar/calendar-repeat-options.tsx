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
        <div className="flex items-center gap-1.5">
          <Repeat className="size-3.5 text-neutral-500" />
          <Label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Repeat
          </Label>
        </div>
        <Button
          type="button"
          variant={isRepeating ? "default" : "outline"}
          size="sm"
          disabled={disabled}
          onClick={() => onChange(isRepeating ? "none" : "daily_workdays")}
          className="h-6.5 cursor-pointer px-2 text-[11px]"
        >
          {isRepeating ? "Repeats" : "Does not repeat"}
        </Button>
      </div>

      {isRepeating && (
        <div className="pt-0.5">
          <Select
            value={frequency}
            onValueChange={(val) => onChange(val as RepeatFrequency)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Frequency">
                {frequency === "daily_workdays" &&
                  "Every workday (Mon–Fri, 1 wk)"}
                {frequency === "daily_all" && "Daily (7 days)"}
                {frequency === "weekly" && "Weekly (4 weeks)"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily_workdays">
                Every workday (Mon–Fri, 1 wk)
              </SelectItem>
              <SelectItem value="daily_all">Daily (7 days)</SelectItem>
              <SelectItem value="weekly">Weekly (4 weeks)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
