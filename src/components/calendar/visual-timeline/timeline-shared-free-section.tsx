"use client";

import * as React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import type { TimeInterval } from "./timeline-types";
import { HOURS, getPercent, formatMinutes } from "./timeline-types";

interface TimelineSharedFreeSectionProps {
  sharedFreeIntervals: TimeInterval[];
  isComputingSlots: boolean;
  handleFindSlotsApi: () => void;
  selectedStartMin: number;
  selectedEndMin: number;
  onTimelineClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSelectTimeSlot: (startMin: number, endMin: number) => void;
}

export function TimelineSharedFreeSection({
  sharedFreeIntervals,
  isComputingSlots,
  handleFindSlotsApi,
  selectedStartMin,
  selectedEndMin,
  onTimelineClick,
  onSelectTimeSlot,
}: TimelineSharedFreeSectionProps) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="flex w-56 shrink-0 flex-col items-start pr-2">
        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
          Team Shared Free Time
        </span>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            Calculated Overlap
          </span>
          <button
            type="button"
            disabled={isComputingSlots}
            onClick={handleFindSlotsApi}
            className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
            title="Query backend conflict-free slot calculation (/api/slots/find)"
          >
            {isComputingSlots ? (
              <Loader2 className="size-2.5 animate-spin" />
            ) : (
              <Sparkles className="size-2.5" />
            )}
            <span>AI Slots API</span>
          </button>
        </div>
      </div>

      <div
        onClick={onTimelineClick}
        className="relative h-10 flex-1 cursor-pointer overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20"
      >
        {HOURS.slice(1, -1).map((hour) => (
          <div
            key={hour}
            className="absolute inset-y-0 border-r border-emerald-200/50 dark:border-emerald-900/30"
            style={{ left: `${((hour - 8) / 10) * 100}%` }}
          />
        ))}

        {sharedFreeIntervals.map((free, idx) => {
          const left = getPercent(free.startMin);
          const width = getPercent(free.endMin) - left;
          const label = `Free: ${formatMinutes(free.startMin)}–${formatMinutes(free.endMin)}`;

          return (
            <div
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                const end = Math.min(free.endMin, free.startMin + 60);
                onSelectTimeSlot(free.startMin, end);
              }}
              style={{ left: `${left}%`, width: `${width}%` }}
              className="shadow-xs absolute inset-y-1 flex cursor-pointer items-center justify-center rounded-md bg-emerald-500/90 px-2 text-[11px] font-bold text-white transition-all hover:bg-emerald-600"
              title={`Click to book this free window (${label})`}
            >
              <Sparkles className="mr-1 size-3" />
              {label}
            </div>
          );
        })}

        <div
          style={{
            left: `${getPercent(selectedStartMin)}%`,
            width: `${getPercent(selectedEndMin) - getPercent(selectedStartMin)}%`,
          }}
          className="pointer-events-none absolute inset-y-0 border-2 border-dashed border-amber-500 bg-amber-400/25"
        />
      </div>
    </div>
  );
}
