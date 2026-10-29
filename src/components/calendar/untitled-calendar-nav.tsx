"use client";

import * as React from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  addDays,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  RefreshCw,
} from "lucide-react";
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

import {
  CalendarAttendeeStack,
  type CalendarAttendeeItem,
} from "@/components/calendar/calendar-attendee-stack";

export type CalendarTabFilter = "all" | "shared" | "public" | "archived";

interface UntitledCalendarNavProps {
  activeTab?: CalendarTabFilter;
  onTabChange?: (tab: CalendarTabFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddEvent: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  currentUser?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  selectedAttendees?: CalendarAttendeeItem[];
  onToggleAttendee?: (item: CalendarAttendeeItem) => void;
  onRemoveAttendee?: (id: string) => void;
  onClearAllAttendees?: () => void;
  isCalculatingSlots?: boolean;
  weekStartsOn?: 0 | 1;
}

export function UntitledCalendarNav({
  searchQuery,
  onSearchChange,
  onOpenAddEvent,
  onRefresh,
  isRefreshing = false,
  currentUser,
  selectedAttendees = [],
  onToggleAttendee,
  onRemoveAttendee,
  onClearAllAttendees,
  isCalculatingSlots = false,
  weekStartsOn = 1,
}: UntitledCalendarNavProps) {
  const { date, prev, next, today } = useEventCalendarNavigation();
  const { view, setView } = useEventCalendarView();

  const rangeSubtitle = React.useMemo(() => {
    if (view === "month") {
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
    }
    if (view === "week") {
      const start = startOfWeek(date, { weekStartsOn });
      const end = endOfWeek(date, { weekStartsOn });
      return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
    }
    if (view === "agenda") {
      const start = startOfDay(date);
      const end = addDays(start, 29);
      return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
    }
    return format(date, "EEEE, MMMM d, yyyy");
  }, [date, view, weekStartsOn]);

  const viewLabelMap: Record<CalendarView, string> = {
    week: "Week view",
    month: "Month view",
    day: "Day view",
    days: "4-Day view",
    agenda: "Agenda view",
    resource: "Resource view",
  };

  return (
    <div className="flex flex-col gap-4 border-b border-neutral-200/80 bg-white px-6 pb-4 pt-5 dark:border-neutral-800 dark:bg-neutral-900">
      {/* Top Row: User Avatars & Availability Check + Search Input */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        {onToggleAttendee && onRemoveAttendee ? (
          <CalendarAttendeeStack
            currentUser={currentUser}
            selectedAttendees={selectedAttendees}
            onToggleAttendee={onToggleAttendee}
            onRemoveAttendee={onRemoveAttendee}
            onClearAll={onClearAllAttendees}
            isCalculatingSlots={isCalculatingSlots}
          />
        ) : (
          <div />
        )}

        {/* Search Input */}
        <div className="relative w-full sm:w-60">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8.5 w-full rounded-lg border border-neutral-200/80 bg-neutral-50/50 pl-8 pr-9 text-xs text-neutral-800 placeholder:text-neutral-400 focus:border-orange-500/60 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-200 dark:placeholder:text-neutral-500 dark:focus:border-orange-500/60"
          />
        </div>
      </div>

      {/* Sub-bar / Date & Navigation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Date Box + Title */}
        <div className="flex items-center gap-3">
          <div className="shadow-2xs flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-neutral-200/90 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-[10px] font-bold uppercase leading-none tracking-wider text-orange-500">
              {format(date, "MMM")}
            </span>
            <span className="text-base font-bold leading-tight text-neutral-900 dark:text-neutral-100">
              {format(date, "d")}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {format(date, "MMMM yyyy")}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {rangeSubtitle}
            </span>
          </div>
        </div>

        {/* Action Controls: [< Today >], [View Dropdown], [+ Add event] */}
        <div className="flex items-center gap-2">
          {/* Navigation group */}
          <div className="shadow-2xs flex items-center rounded-lg border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-l-lg text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
            <button
              type="button"
              onClick={today}
              className="h-8 cursor-pointer px-3 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-orange-600 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-orange-400"
            >
              Today
            </button>
            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
            <button
              type="button"
              onClick={next}
              aria-label="Next"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-r-lg text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* View selector dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="shadow-2xs h-8 cursor-pointer gap-1.5 border-neutral-200/80 px-3 text-xs font-medium text-neutral-800 dark:border-neutral-800 dark:text-neutral-200"
                >
                  <span>{viewLabelMap[view] ?? "Week view"}</span>
                  <ChevronDown className="size-3.5 text-neutral-400" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={() => setView("week")}
                className="cursor-pointer text-xs"
              >
                Week view
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setView("month")}
                className="cursor-pointer text-xs"
              >
                Month view
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setView("day")}
                className="cursor-pointer text-xs"
              >
                Day view
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setView("agenda")}
                className="cursor-pointer text-xs"
              >
                Agenda view
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh button */}
          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="shadow-2xs h-8 cursor-pointer gap-1.5 border-neutral-200/80 px-2.5 text-xs font-medium text-neutral-800 dark:border-neutral-800 dark:text-neutral-200"
              title="Refresh calendar"
            >
              <RefreshCw
                className={`size-3.5 ${isRefreshing ? "animate-spin text-orange-500" : "text-neutral-500"}`}
              />
            </Button>
          )}

          {/* Add event button */}
          <Button
            type="button"
            onClick={onOpenAddEvent}
            size="sm"
            className="shadow-2xs h-8 cursor-pointer gap-1.5 rounded-lg bg-neutral-900 px-3.5 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          >
            <Plus className="size-3.5 text-orange-400 dark:text-orange-500" />
            <span>Add event</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
