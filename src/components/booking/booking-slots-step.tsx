"use client";

import * as React from "react";
import { format, isBefore, startOfToday } from "date-fns";
import { Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import type { Slot } from "./booking-types";
import { formatSlotTime } from "./booking-utils";

interface BookingSlotsStepProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date) => void;
  slots: Slot[];
  loadingSlots: boolean;
  timeZone: string;
  onSelectSlot: (slot: Slot) => void;
}

export function BookingSlotsStep({
  selectedDate,
  onSelectDate,
  slots,
  loadingSlots,
  timeZone,
  onSelectSlot,
}: BookingSlotsStepProps) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="flex flex-col items-center sm:items-start lg:col-span-7">
        <h2 className="text-foreground mb-4 flex items-center gap-2 text-base font-semibold">
          <CalendarIcon className="h-4 w-4 text-orange-500" />
          Select a Date
        </h2>

        <div className="border-border shadow-xs bg-card w-full rounded-2xl border p-2 sm:w-auto">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) onSelectDate(date);
            }}
            disabled={(date) => isBefore(date, startOfToday())}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="flex flex-col lg:col-span-5">
        <h2 className="text-foreground mb-1 flex items-center gap-2 text-base font-semibold">
          <Clock className="h-4 w-4 text-orange-500" />
          Select a Time
        </h2>
        <p className="text-muted-foreground mb-4 text-xs">
          {selectedDate
            ? format(selectedDate, "EEEE, MMMM d")
            : "Pick a date to view available times"}
        </p>

        <div className="max-h-[380px] flex-1 space-y-2 overflow-y-auto pr-1">
          {loadingSlots ? (
            <div className="text-muted-foreground flex h-48 flex-col items-center justify-center gap-2 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              <span className="text-xs font-medium">Checking mutual availability...</span>
            </div>
          ) : slots.length === 0 ? (
            <div className="border-border flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed p-4 text-center">
              <Clock className="text-muted-foreground/40 mb-2 h-8 w-8" />
              <p className="text-foreground text-xs font-semibold">No open slots</p>
              <p className="text-muted-foreground mt-1 text-[11px]">
                No mutual free time found for all required attendees on this date.
              </p>
            </div>
          ) : (
            slots.map((slot, idx) => (
              <Button
                key={idx}
                variant="outline"
                onClick={() => onSelectSlot(slot)}
                className="border-border group h-11 w-full justify-between rounded-xl text-xs font-medium transition-all hover:border-orange-500 hover:bg-orange-500/5 hover:text-orange-600 sm:text-sm dark:hover:text-orange-400"
              >
                <span className="text-foreground font-semibold group-hover:text-orange-600 dark:group-hover:text-orange-400">
                  {formatSlotTime(slot.start, timeZone)}
                </span>
                <span className="text-muted-foreground text-xs group-hover:text-orange-600 dark:group-hover:text-orange-400">
                  {formatSlotTime(slot.end, timeZone)}
                </span>
              </Button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
