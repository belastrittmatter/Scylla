"use client";

import * as React from "react";
import { formatMinutes } from "./timeline-types";

interface TimelineHeaderProps {
  selectedStartMin: number;
  selectedEndMin: number;
}

export function TimelineHeader({ selectedStartMin, selectedEndMin }: TimelineHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-neutral-200/80 pb-5 sm:flex-row sm:items-center dark:border-neutral-800">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Combined Visual Timeline (People & Meeting Rooms)
        </h2>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          Working hours: 08:00 to 18:00 ICT
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
        <div className="flex items-center gap-1.5">
          <span className="shadow-2xs size-2.5 rounded-full bg-rose-500" />
          <span className="text-neutral-600 dark:text-neutral-300">Person Busy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="shadow-2xs size-2.5 rounded-full bg-indigo-600" />
          <span className="text-neutral-600 dark:text-neutral-300">Room Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="shadow-2xs size-2.5 rounded-full bg-emerald-500" />
          <span className="text-neutral-600 dark:text-neutral-300">All Free Overlap</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="shadow-2xs size-2.5 rounded-full bg-amber-400 ring-2 ring-amber-300" />
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            Selected ({formatMinutes(selectedStartMin)}–{formatMinutes(selectedEndMin)})
          </span>
        </div>
      </div>
    </div>
  );
}
