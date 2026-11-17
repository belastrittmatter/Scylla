"use client";

import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useEventCalendarNavigation,
  useEventCalendarView,
} from "@/components/reui/event-calendar/event-calendar";
import type { CalendarView } from "@/components/reui/event-calendar/event-calendar-types";
import { getRangeLabel } from "./calendar-toolbar-lib";

const VIEWS: Array<{ id: CalendarView; label: string }> = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "agenda", label: "Agenda" },
];

interface CalendarToolbarProps {
  weekStartsOn?: 0 | 1;
}

export function CalendarToolbar({
  weekStartsOn = 1,
}: CalendarToolbarProps): React.ReactElement {
  const { date, prev, next, today } = useEventCalendarNavigation();
  const { view, setView } = useEventCalendarView();
  const rangeLabel = getRangeLabel(view, date, weekStartsOn);

  return (
    <div className="flex h-11 shrink-0 items-center gap-2.5 border-b px-3">
      <div className="flex shrink-0 items-center divide-x rounded-md border">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={prev}
          aria-label="Previous period"
          className="rounded-none rounded-l-[5px]"
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={today}
          className="rounded-none px-2.5 text-xs"
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={next}
          aria-label="Next period"
          className="rounded-none rounded-r-[5px]"
        >
          <ChevronRight />
        </Button>
      </div>

      <span className="min-w-0 truncate text-sm font-semibold tracking-tight tabular-nums">
        {rangeLabel}
      </span>

      <div className="ml-auto hidden shrink-0 items-center gap-0.5 rounded-md border p-0.5 xl:flex">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setView(item.id)}
            aria-pressed={view === item.id}
            className={`h-6 cursor-pointer rounded-[4px] px-2.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 ${
              view === item.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="ml-auto hidden shrink-0 gap-1.5 text-xs md:inline-flex xl:hidden"
            >
              <span>
                {VIEWS.find((item) => item.id === view)?.label ?? "Week"}
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-36">
          {VIEWS.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => setView(item.id)}
              className="cursor-pointer text-xs"
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Phones are locked to day view; month, week and agenda are desktop-only. */
export function CalendarMobileDayLock(): null {
  const { setView } = useEventCalendarView();

  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const apply = (): void => {
      if (query.matches) setView("day");
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [setView]);

  return null;
}
