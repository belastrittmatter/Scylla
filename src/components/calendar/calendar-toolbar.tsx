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
    <div className="flex h-11 shrink-0 items-center gap-1.5 border-b bg-muted/30 px-3">
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={prev}
          aria-label="Previous period"
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={today}
          className="px-2 text-xs"
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={next}
          aria-label="Next period"
        >
          <ChevronRight />
        </Button>
      </div>

      <span className="min-w-0 truncate pl-1 text-sm font-semibold tracking-tight">
        {rangeLabel}
      </span>

      <div className="ml-auto hidden shrink-0 items-center gap-0.5 rounded-lg bg-muted p-0.5 xl:flex">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setView(item.id)}
            aria-pressed={view === item.id}
            className={`h-7 cursor-pointer rounded-md px-2.5 text-xs font-medium transition-colors ${
              view === item.id
                ? "bg-card text-card-foreground shadow-sm ring-1 ring-border/50"
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
