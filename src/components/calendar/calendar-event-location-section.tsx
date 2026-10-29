"use client";

import * as React from "react";
import { Building2 } from "lucide-react";
import type { CustomEventData } from "@/mock-data/calendar-events";

interface CalendarEventLocationSectionProps {
  roomDetails?: CustomEventData["roomDetails"];
  location?: string;
}

export function CalendarEventLocationSection({
  roomDetails,
  location,
}: CalendarEventLocationSectionProps) {
  if (!roomDetails && (!location || location === "Google Meet")) {
    return null;
  }

  return (
    <div className="rounded-lg border border-neutral-200/80 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
          <Building2 className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100">
            {roomDetails?.name || location}
          </p>
          <p className="truncate text-[11px] text-neutral-500">
            {roomDetails?.building || "Main Office"}
            {roomDetails?.floor ? ` • ${roomDetails.floor}` : ""}
            {roomDetails?.capacity
              ? ` (Capacity: ${roomDetails.capacity} pax)`
              : ""}
          </p>
        </div>
      </div>

      {/* Room Equipment Badges */}
      {roomDetails?.equipment && roomDetails.equipment.length > 0 && (
        <div className="mt-3 border-t border-neutral-100 pt-2.5 dark:border-neutral-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Room Equipment & Amenities
          </span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {roomDetails.equipment.map((item, idx) => (
              <span
                key={idx}
                className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
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
