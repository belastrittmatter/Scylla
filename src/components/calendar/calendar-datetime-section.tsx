"use client";

import * as React from "react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarDateTimeSectionProps {
  dateStr: string;
  onDateChange: (dateStr: string) => void;
  startTime: string;
  onStartTimeChange: (startTime: string) => void;
  endTime: string;
  onEndTimeChange: (endTime: string) => void;
  durationMinutes: number;
  onSetDuration: (mins: number) => void;
}

export function CalendarDateTimeSection({
  dateStr,
  onDateChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  durationMinutes,
  onSetDuration,
}: CalendarDateTimeSectionProps) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const dateObj = React.useMemo(() => {
    if (!dateStr) return undefined;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [dateStr]);

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200/70 bg-neutral-50/40 p-3 dark:border-neutral-800 dark:bg-neutral-900/30">
      {/* Date & Time Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
            Date
          </Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-8.5 w-full justify-start px-2.5 text-left text-xs font-normal",
                    !dateStr && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 size-3.5 shrink-0 text-neutral-500" />
                  {dateObj ? format(dateObj, "EEE, MMM d, yyyy") : "Pick date"}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateObj}
                onSelect={(date) => {
                  if (date) {
                    onDateChange(format(date, "yyyy-MM-dd"));
                    setIsCalendarOpen(false);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
              Start
            </Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              required
              className="h-8.5 text-xs px-2"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
              End
            </Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              required
              className="h-8.5 text-xs px-2"
            />
          </div>
        </div>
      </div>

      {/* Duration quick pills */}
      <div className="flex items-center justify-between gap-2 border-t border-neutral-200/60 pt-2 dark:border-neutral-800/60">
        <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <Clock className="size-3.5" />
          <span>
            {durationMinutes >= 60
              ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60 ? `${durationMinutes % 60}m` : ""}`
              : `${durationMinutes}m`}
          </span>
        </span>

        <div className="flex items-center gap-1">
          {[15, 30, 45, 60].map((mins) => (
            <Button
              key={mins}
              type="button"
              variant={durationMinutes === mins ? "default" : "outline"}
              size="sm"
              onClick={() => onSetDuration(mins)}
              className="h-6 px-2 text-[10px]"
            >
              {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
