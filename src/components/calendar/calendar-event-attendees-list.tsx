"use client";

import * as React from "react";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { CustomEventData } from "@/mock-data/calendar-events";

interface CalendarEventAttendeesListProps {
  attendees: NonNullable<CustomEventData["attendees"]>;
  organizer?: CustomEventData["organizer"];
  attendeeFilter: string;
  onFilterChange: (val: string) => void;
  filteredAttendees: NonNullable<CustomEventData["attendees"]>;
}

export function CalendarEventAttendeesList({
  attendees,
  organizer,
  attendeeFilter,
  onFilterChange,
  filteredAttendees,
}: CalendarEventAttendeesListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Attendees
          </label>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {attendees.length}
          </span>
        </div>
        {organizer &&
          !attendees.some(
            (a) =>
              a.email.toLowerCase() === (organizer.email || "").toLowerCase(),
          ) && (
            <span
              className="max-w-[200px] truncate text-[11px] text-neutral-400"
              title={`Organized by ${organizer.name || organizer.email}`}
            >
              Host: {organizer.name || organizer.email}
            </span>
          )}
      </div>

      {attendees.length > 5 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-neutral-400" />
          <Input
            value={attendeeFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="Filter attendees by name or email..."
            className="h-8 border-neutral-200 bg-neutral-50/50 pl-8 text-xs dark:border-neutral-800 dark:bg-neutral-900/50"
          />
        </div>
      )}

      {attendees.length > 0 ? (
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-neutral-200/80 bg-neutral-50/30 p-2 dark:border-neutral-800 dark:bg-neutral-900/40">
          {filteredAttendees.length > 0 ? (
            filteredAttendees.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2.5 rounded-md p-1.5 transition-colors hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <UserAvatar
                    user={{
                      name: att.name,
                      email: att.email,
                      image: att.avatar,
                    }}
                    className="size-6 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium leading-tight text-neutral-900 dark:text-neutral-100">
                      {att.name || att.email}
                    </p>
                    {att.name &&
                      att.email &&
                      att.name.toLowerCase() !== att.email.toLowerCase() && (
                        <p className="mt-0.5 truncate text-[10px] leading-tight text-neutral-400 dark:text-neutral-500">
                          {att.email}
                        </p>
                      )}
                  </div>
                </div>

                <span className="shrink-0 rounded border border-neutral-200/60 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:border-neutral-700/60 dark:bg-neutral-800 dark:text-neutral-400">
                  {att.role || "Attendee"}
                </span>
              </div>
            ))
          ) : (
            <p className="py-2 text-center text-[11px] italic text-neutral-400">
              No attendees match &quot;{attendeeFilter}&quot;
            </p>
          )}
        </div>
      ) : (
        <p className="px-1 text-[11px] italic text-neutral-400">
          No external attendees invited yet.
        </p>
      )}
    </div>
  );
}
