"use client";

import * as React from "react";
import { format, isBefore, startOfToday } from "date-fns";
import { getDefaultClassNames } from "react-day-picker";
import { Globe, Loader2 } from "lucide-react";
import { cn } from "cn";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/landing/primitives";
import type { Slot } from "./booking-types";
import { formatSlotTime } from "./booking-utils";

interface BookingSlotsStepProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date) => void;
  slots: Slot[];
  loadingSlots: boolean;
  timeZone: string;
  /** The invite books a physical room, so free times include the room too. */
  includesRoom?: boolean;
  onSelectSlot: (slot: Slot) => void;
}

export function BookingSlotsStep({
  selectedDate,
  onSelectDate,
  slots,
  loadingSlots,
  timeZone,
  includesRoom = false,
  onSelectSlot,
}: BookingSlotsStepProps) {
  const rdp = getDefaultClassNames();

  const status = !selectedDate
    ? "Pick a date to view available times"
    : loadingSlots
      ? "Checking availability…"
      : slots.length === 0
        ? "No open times"
        : `${slots.length} ${slots.length === 1 ? "time" : "times"} available`;

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10">
      <section aria-labelledby="booking-date-heading" className="min-w-0">
        <Eyebrow as="h2" id="booking-date-heading" className="text-ink-2">
          Select a date
        </Eyebrow>

        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) onSelectDate(date);
          }}
          disabled={(date) => isBefore(date, startOfToday())}
          className="mt-4 bg-transparent p-0 tabular-nums [--cell-size:--spacing(9)] md:[--cell-size:--spacing(10)]"
          classNames={{
            root: cn("w-full md:w-fit", rdp.root),
            caption_label: cn(
              "font-code text-ink text-sm select-none",
              rdp.caption_label,
            ),
            weekday: cn(
              "font-code text-ink-3 flex-1 text-[11px] uppercase select-none",
              rdp.weekday,
            ),
            // Today reads as ember text; once selected, the ember chip alone marks it.
            today: cn("text-ember font-medium", rdp.today),
          }}
        />
      </section>

      <section aria-labelledby="booking-time-heading" className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <Eyebrow as="h2" id="booking-time-heading" className="text-ink-2">
            Select a time
          </Eyebrow>
          <p className="text-ink-2 font-code flex items-center gap-1.5 text-xs">
            <Globe className="size-3.5" aria-hidden="true" />
            <span className="sr-only">Time zone:</span>
            {timeZone}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="text-ink text-base font-medium">
            {selectedDate
              ? format(selectedDate, "EEEE, MMMM d")
              : "No date selected"}
          </p>
          <p
            role="status"
            aria-live="polite"
            className="text-ink-2 font-code text-xs tabular-nums"
          >
            {status}
          </p>
        </div>
        <p className="text-ink-2 mt-1 text-xs">
          Times shown are when everyone{includesRoom ? " and the room" : ""} is
          free.
        </p>

        <div className="mt-4">
          {loadingSlots ? (
            <div className="border-line text-ink-2 flex h-32 items-center justify-center gap-2 rounded-lg border border-dashed text-sm">
              <Loader2
                className="text-ink-3 size-4 animate-spin"
                aria-hidden="true"
              />
              Checking mutual availability…
            </div>
          ) : slots.length === 0 ? (
            <div className="border-line rounded-lg border border-dashed p-5">
              <p className="text-ink text-sm font-medium">No open slots</p>
              <p className="text-ink-2 mt-1 text-xs">
                No mutual free time found for all required attendees on this
                date. Try another day.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-3 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {slots.map((slot) => {
                const start = formatSlotTime(slot.start, timeZone);
                const end = formatSlotTime(slot.end, timeZone);
                return (
                  <li key={slot.start}>
                    <Button
                      variant="outline"
                      onClick={() => onSelectSlot(slot)}
                      aria-label={`${start} to ${end}`}
                      className="font-code text-ink hover:border-ember hover:text-ember dark:hover:border-ember h-11 w-full rounded-lg text-sm tabular-nums hover:bg-transparent dark:hover:bg-transparent"
                    >
                      {start}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
