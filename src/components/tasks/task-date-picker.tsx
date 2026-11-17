"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "cn";

interface TaskDatePickerProps {
  /** Trigger id; with `labelId` the trigger reads as "<label> <date>". */
  id?: string;
  /** Id of the visible field label that names this picker. */
  labelId?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function TaskDatePicker({
  id,
  labelId,
  value,
  onChange,
  className,
  placeholder = "Pick target deadline",
}: TaskDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const dateObj = React.useMemo(() => {
    if (!value) return undefined;
    try {
      const d = parseISO(value);
      return isNaN(d.getTime()) ? undefined : d;
    } catch {
      return undefined;
    }
  }, [value]);

  return (
    <div className={cn("relative flex items-center", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              aria-labelledby={labelId && id ? `${labelId} ${id}` : undefined}
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-9 w-full min-w-0 justify-start pl-3 text-left text-sm font-normal",
                // Keep text clear of the absolutely placed clear button.
                value ? "pr-9" : "pr-3",
                !value && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
              {dateObj ? (
                <span className="truncate font-code text-xs tabular-nums">
                  {format(dateObj, "MMM d, yyyy")}
                </span>
              ) : (
                <span className="truncate">{placeholder}</span>
              )}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateObj}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, "yyyy-MM-dd"));
                setIsOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-1.5 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label="Clear date"
          title="Clear date"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
