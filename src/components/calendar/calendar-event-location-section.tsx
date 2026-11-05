"use client";

import * as React from "react";
import { Building2 } from "lucide-react";
import type { CustomEventData } from "@/mock-data/calendar-events";

interface CalendarEventLocationSectionProps {
  roomDetails?: CustomEventData["roomDetails"];
  roomEmail?: string;
  location?: string;
}

export function CalendarEventLocationSection({
  roomDetails,
  roomEmail,
  location,
}: CalendarEventLocationSectionProps): React.ReactElement | null {
  if (!roomDetails && (!location || location === "Google Meet")) {
    return null;
  }

  const roomName = roomDetails?.name || location;

  return (
    <div className="rounded-lg border bg-muted/40 p-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Building2 aria-hidden className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">
            {roomName}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {[
              roomEmail,
              roomDetails?.capacity ? `${roomDetails.capacity} seats` : null,
            ]
              .filter(Boolean)
              .join(" · ") ||
              roomDetails?.building ||
              "Main Office"}
          </p>
        </div>
      </div>

      {roomDetails?.equipment && roomDetails.equipment.length > 0 && (
        <div className="mt-3 border-t pt-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Room equipment
          </span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {roomDetails.equipment.map((item) => (
              <span
                key={item}
                className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
