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
import {
  focusTargetClass,
  formatSlotTime,
  getSlotHour,
} from "./booking-utils";

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
  /**
   * Where focus lands when this step mounts after the form step: the start of
   * the slot picked before (if it is still listed), else the time section.
   */
  restoreFocusTo?: string | null;
}

type SlotsState = "loading" | "error" | "empty" | "ready";

const SLOT_GROUPS = [
  { id: "morning", label: "Morning", from: 0, to: 12 },
  { id: "afternoon", label: "Afternoon", from: 12, to: 18 },
  { id: "evening", label: "Evening", from: 18, to: 24 },
] as const;

const subLabelClass =
  "font-code text-ink-2 text-[11px] uppercase tracking-[0.12em]";

/**
 * Below md the time list sits under the calendar, so after a date tap the
 * new times would change off-screen: bring the time section up to meet them.
 */
function revealTimesOnMobile(target: HTMLElement | null) {
  if (!target || typeof window === "undefined") return;
  if (!window.matchMedia("(max-width: 767px)").matches) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

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
  restoreFocusTo = null,
}: BookingSlotsStepProps) {
  const rdp = getDefaultClassNames();
  const timeSectionRef = React.useRef<HTMLElement>(null);

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

  // Returning from the form step: put focus back where the invitee left off.
  // Runs once on mount; the slots are still loaded when this step remounts.
  React.useEffect(() => {
    if (!restoreFocusTo) return;
    const section = timeSectionRef.current;
    const slotButton = section?.querySelector<HTMLElement>(
      `[data-slot-start="${CSS.escape(restoreFocusTo)}"]`,
    );
    (slotButton ?? section)?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // lg: calendar and times split by a full-height hairline, like the
    // sidebar; the time list scrolls inside the calendar's height.
    <div className="grid grid-cols-1 gap-5 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10 lg:-my-8 lg:gap-0 lg:divide-x lg:divide-line">
      <section
        aria-labelledby="booking-date-heading"
        className="min-w-0 lg:py-8 lg:pr-8"
      >
        <Eyebrow as="h2" id="booking-date-heading" className="text-ink-2">
          Select a date
        </Eyebrow>

        {ready ? (
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              onSelectDate(date);
              revealTimesOnMobile(timeSectionRef.current);
            }}
            disabled={(date) => isBefore(date, startOfToday())}
            className="mt-3 bg-transparent p-0 tabular-nums [--cell-size:--spacing(9)] md:mt-4 md:[--cell-size:--spacing(10)]"
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
            className="bg-paper mt-3 h-64 w-full rounded-lg md:mt-4 md:h-73 md:w-[280px]"
          />
        )}
      </section>

      <section
        ref={timeSectionRef}
        tabIndex={-1}
        aria-labelledby="booking-time-heading"
        className={cn(
          "min-w-0 scroll-mt-4 lg:flex lg:h-0 lg:min-h-full lg:flex-col lg:pt-8 lg:pl-8",
          focusTargetClass,
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <Eyebrow as="h2" id="booking-time-heading" className="text-ink-2">
            Select a time
          </Eyebrow>
          <p className="text-ink-2 font-code flex min-w-0 items-center gap-1.5 text-xs">
            <Globe className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="sr-only">Time zone:</span>
            <span className="[overflow-wrap:anywhere]">{timeZone ?? ""}</span>
          </p>
        </div>

        <p className="text-ink mt-3 min-h-6 text-base font-medium md:mt-4">
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

        <div className="mt-3 md:mt-5 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
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
            <div
              // lg: an inner scroller capped to the calendar's height that runs
              // to the card edge, so the next group peeks through the bottom
              // fade ("more below"); the bottom padding lets the last row clear it.
              className="space-y-4 md:space-y-5 lg:-mx-1 lg:min-h-0 lg:flex-1 lg:scroll-pt-8 lg:space-y-3 lg:overflow-y-auto lg:px-1 lg:pb-10 lg:[mask-image:linear-gradient(to_bottom,#000_calc(100%-2.5rem),transparent)] lg:[scrollbar-color:var(--line)_transparent] lg:[scrollbar-width:thin] lg:hover:[scrollbar-color:var(--ink-3)_transparent]"
            >
              {groups.map((group) => {
                const headingId = `booking-slots-${group.id}`;
                return (
                  <div key={group.id} role="group" aria-labelledby={headingId}>
                    <h3
                      id={headingId}
                      className={cn(
                        subLabelClass,
                        "bg-surface lg:sticky lg:top-0 lg:z-10 lg:py-1.5",
                      )}
                    >
                      {group.label}
                    </h3>
                    <ul className="mt-2 grid grid-cols-3 gap-1.5 md:grid-cols-2 md:gap-2 lg:mt-0.5 xl:grid-cols-4">
                      {group.slots.map((slot) => {
                        const start = formatSlotTime(slot.start, zone);
                        const end = formatSlotTime(slot.end, zone);
                        return (
                          <li key={slot.start}>
                            <Button
                              variant="outline"
                              onClick={() => onSelectSlot(slot)}
                              data-slot-start={slot.start}
                              aria-label={`${start} to ${end}`}
                              className="font-code border-line text-ink hover:border-ember h-10 w-full rounded-lg bg-transparent text-sm tabular-nums hover:bg-transparent md:h-11 xl:h-10 dark:bg-transparent dark:hover:bg-transparent"
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
