"use client";

import * as React from "react";
import { format, isBefore, startOfToday } from "date-fns";
import { getDefaultClassNames } from "react-day-picker";
import { Globe, Loader2, RotateCw } from "lucide-react";
import { cn } from "cn";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/landing/primitives";
import type { Slot } from "./booking-types";
import { formatSlotTime, getSlotHour } from "./booking-utils";

interface BookingSlotsStepProps {
  /** False until the invitee's own time zone and today are known (after mount). */
  ready: boolean;
  selectedDate: Date | undefined;
  onSelectDate: (date: Date) => void;
  slots: Slot[];
  loadingSlots: boolean;
  /** The last slot fetch failed; the invitee can retry it. */
  slotsError?: boolean;
  onRetry?: () => void;
  timeZone: string | null;
  /** The invite books a physical room, so free times include the room too. */
  includesRoom?: boolean;
  onSelectSlot: (slot: Slot) => void;
}

type SlotsState = "loading" | "error" | "empty" | "ready";

const SLOT_GROUPS = [
  { id: "morning", label: "Morning", from: 0, to: 12 },
  { id: "afternoon", label: "Afternoon", from: 12, to: 18 },
  { id: "evening", label: "Evening", from: 18, to: 24 },
] as const;

const subLabelClass =
  "font-code text-ink-2 text-[11px] uppercase tracking-[0.12em]";

export function BookingSlotsStep({
  ready,
  selectedDate,
  onSelectDate,
  slots,
  loadingSlots,
  slotsError = false,
  onRetry,
  timeZone,
  includesRoom = false,
  onSelectSlot,
}: BookingSlotsStepProps) {
  const rdp = getDefaultClassNames();

  const state: SlotsState =
    !ready || loadingSlots
      ? "loading"
      : slotsError
        ? "error"
        : slots.length === 0
          ? "empty"
          : "ready";

  const whoIsFree = `everyone${includesRoom ? " and the room" : ""} is free`;
  const countLabel = `${slots.length} open ${slots.length === 1 ? "time" : "times"}`;

  const status = {
    loading: "Checking availability…",
    error: "Couldn't load times for this date",
    empty: "No open times on this date",
    ready: countLabel,
  }[state];

  // Slots only load once the client zone is known; UTC is a type-level fallback.
  const zone = timeZone ?? "UTC";

  const groups = React.useMemo(() => {
    return SLOT_GROUPS.map((group) => ({
      ...group,
      slots: slots.filter((slot) => {
        const hour = getSlotHour(slot.start, zone);
        return hour >= group.from && hour < group.to;
      }),
    })).filter((group) => group.slots.length > 0);
  }, [slots, zone]);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10">
      <section aria-labelledby="booking-date-heading" className="min-w-0">
        <Eyebrow as="h2" id="booking-date-heading" className="text-ink-2">
          Select a date
        </Eyebrow>

        {ready ? (
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) onSelectDate(date);
            }}
            disabled={(date) => isBefore(date, startOfToday())}
            className="mt-4 bg-transparent p-0 tabular-nums [--cell-size:--spacing(10)]"
            classNames={{
              root: cn("w-full md:w-fit", rdp.root),
              caption_label: cn(
                "font-code text-ink text-sm select-none",
                rdp.caption_label,
              ),
              weekday: cn(
                "font-code text-ink-2 flex-1 text-[11px] uppercase select-none",
                rdp.weekday,
              ),
              week: cn("mt-1 flex w-full", rdp.week),
              // Columns stretch on mobile; rows stay one cell tall.
              day: cn(
                "group/day relative h-(--cell-size) w-full rounded-(--cell-radius) p-0 text-center select-none",
                rdp.day,
              ),
              day_button: cn("aspect-auto h-(--cell-size)", rdp.day_button),
              // Today reads as ember-deep digits; once selected, the fill alone marks it.
              today: cn("text-ember-deep font-medium", rdp.today),
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="bg-paper mt-4 h-73 w-full rounded-lg md:w-[280px]"
          />
        )}
      </section>

      <section aria-labelledby="booking-time-heading" className="min-w-0">
        <div className="flex items-center justify-between gap-4">
          <Eyebrow as="h2" id="booking-time-heading" className="text-ink-2">
            Select a time
          </Eyebrow>
          <p className="text-ink-2 font-code flex min-w-0 items-center gap-1.5 text-xs">
            <Globe className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="sr-only">Time zone:</span>
            <span className="truncate">{timeZone ?? ""}</span>
          </p>
        </div>

        <p className="text-ink mt-4 min-h-6 text-base font-medium">
          {ready && selectedDate ? format(selectedDate, "EEEE, MMMM d") : ""}
        </p>
        <p className="text-ink-2 font-code mt-0.5 text-xs tabular-nums">
          {state === "ready"
            ? `${countLabel} · ${whoIsFree}`
            : `Times when ${whoIsFree}`}
        </p>
        <p role="status" aria-live="polite" className="sr-only">
          {status}
        </p>

        <div className="mt-5">
          {state === "loading" ? (
            <div className="border-line text-ink-2 flex h-32 items-center justify-center gap-2 rounded-lg border border-dashed text-sm">
              <Loader2
                className="text-ink-3 size-4 animate-spin"
                aria-hidden="true"
              />
              Checking mutual availability…
            </div>
          ) : state === "error" ? (
            <div className="border-line flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-5">
              <div className="min-w-0">
                <p className="text-ink text-sm font-medium">
                  Couldn&apos;t load times for this date
                </p>
                <p className="text-ink-2 mt-1 text-xs">
                  Check your connection, then try again.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-1.5"
              >
                <RotateCw aria-hidden="true" />
                Retry
              </Button>
            </div>
          ) : state === "empty" ? (
            <div className="border-line rounded-lg border border-dashed p-5">
              <p className="text-ink text-sm font-medium">No open times</p>
              <p className="text-ink-2 mt-1 text-xs">
                No mutual free time found for all required attendees on this
                date. Try another day.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map((group) => {
                const headingId = `booking-slots-${group.id}`;
                return (
                  <div key={group.id} role="group" aria-labelledby={headingId}>
                    <h3 id={headingId} className={subLabelClass}>
                      {group.label}
                    </h3>
                    <ul className="mt-2 grid grid-cols-3 gap-2 md:grid-cols-2 xl:grid-cols-4">
                      {group.slots.map((slot) => {
                        const start = formatSlotTime(slot.start, zone);
                        const end = formatSlotTime(slot.end, zone);
                        return (
                          <li key={slot.start}>
                            <Button
                              variant="outline"
                              onClick={() => onSelectSlot(slot)}
                              aria-label={`${start} to ${end}`}
                              className="font-code border-line text-ink-2 hover:border-ember hover:text-ink focus-visible:text-ink h-11 w-full rounded-lg bg-transparent text-sm tabular-nums hover:bg-transparent xl:h-10 dark:bg-transparent dark:hover:bg-transparent"
                            >
                              {start}
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
