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
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TaskDatePicker({
  value,
  onChange,
  className,
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
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-9 w-full justify-start px-3 text-left text-sm font-normal",
                !value && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 size-4 shrink-0 text-neutral-500" />
              {dateObj ? format(dateObj, "PPP") : "Pick target deadline"}
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
          className="absolute right-2.5 rounded-full p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          title="Clear date"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
