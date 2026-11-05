"use client";

import * as React from "react";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { formatPersonName } from "@/lib/format-person-name";
import type { CustomEventData } from "@/mock-data/calendar-events";

type Attendee = NonNullable<CustomEventData["attendees"]>[number];

interface CalendarEventAttendeesListProps {
  attendees: Attendee[];
  organizer?: CustomEventData["organizer"];
  attendeeFilter: string;
  onFilterChange: (val: string) => void;
  filteredAttendees: Attendee[];
}

function isOrganizer(
  attendee: Attendee,
  organizer?: CustomEventData["organizer"],
): boolean {
  const organizerEmail = organizer?.email?.toLowerCase();
  return Boolean(
    organizerEmail && attendee.email.toLowerCase() === organizerEmail,
  );
}

export function CalendarEventAttendeesList({
  attendees,
  organizer,
  attendeeFilter,
  onFilterChange,
  filteredAttendees,
}: CalendarEventAttendeesListProps): React.ReactElement {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-semibold text-foreground">
          Attendees
        </label>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {attendees.length}
        </span>
      </div>

      {attendees.length > 5 && (
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground"
          />
          <Input
            value={attendeeFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="Filter attendees by name or email..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      )}

      {attendees.length > 0 ? (
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border bg-muted/30 p-2">
          {filteredAttendees.length > 0 ? (
            filteredAttendees.map((att) => {
              const name = formatPersonName(att.name, att.email);
              return (
                <div
                  key={att.email}
                  className="flex items-center gap-2.5 rounded-md p-1.5 transition-colors hover:bg-muted/60"
                >
                  <UserAvatar
                    user={{
                      name,
                      email: att.email,
                      image: att.avatar,
                    }}
                    className="size-6 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium leading-tight text-foreground">
                      {name}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground">
                      {att.email}
                    </p>
                  </div>
                  {isOrganizer(att, organizer) && (
                    <span className="shrink-0 text-[10px] font-semibold tracking-wide text-muted-foreground">
                      HOST
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <p className="py-2 text-center text-[11px] italic text-muted-foreground">
              No attendees match &quot;{attendeeFilter}&quot;
            </p>
          )}
        </div>
      ) : (
        <p className="px-1 text-[11px] italic text-muted-foreground">
          No external attendees invited yet.
        </p>
      )}
    </div>
  );
}
