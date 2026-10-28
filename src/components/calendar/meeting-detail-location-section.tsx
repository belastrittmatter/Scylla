"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Video, Building } from "lucide-react";
import type { MeetingItem } from "@/mock-data/meetings-data";

interface MeetingDetailLocationSectionProps {
  meeting: MeetingItem;
  onJoinCall: () => void;
}

export function MeetingDetailLocationSection({
  meeting,
  onJoinCall,
}: MeetingDetailLocationSectionProps) {
  return (
    <div className="space-y-1.5">
      <label className="font-semibold text-neutral-700 dark:text-neutral-300">
        Location & Details
      </label>
      <div className="rounded-lg border border-neutral-200/80 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {meeting.locationType === "virtual" ? (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
                <Video className="size-4" />
              </div>
            ) : (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Building className="size-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-neutral-900 dark:text-neutral-100">
                {meeting.location}
              </span>
              {meeting.roomDetails?.floor && (
                <p className="truncate text-[11px] text-neutral-400">
                  {meeting.roomDetails.floor} (Capacity: {meeting.roomDetails.capacity} people)
                </p>
              )}
            </div>
          </div>

          {meeting.meetingUrl && (
            <Button
              size="sm"
              onClick={onJoinCall}
              className="h-8 shrink-0 cursor-pointer gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
            >
              <Video className="size-3.5" />
              Join Video Call
            </Button>
          )}
        </div>

        {/* Room facilities list if room */}
        {meeting.roomDetails?.facilities && (
          <div className="mt-3 border-t border-neutral-100 pt-2.5 dark:border-neutral-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Room Equipment
            </span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {meeting.roomDetails.facilities.map((fac) => (
                <span
                  key={fac}
                  className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                >
                  {fac}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
