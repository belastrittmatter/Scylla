"use client";

import * as React from "react";
import { Clock, Video, MapPin, CheckCircle2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import type { MeetingItem } from "@/mock-data/meetings-data";

interface MeetingCardItemProps {
  meeting: MeetingItem;
  copiedId: string | null;
  onSelectMeeting: (meeting: MeetingItem) => void;
  onCopyLink: (e: React.MouseEvent, meeting: MeetingItem) => void;
  onJoinCall: (e: React.MouseEvent, meeting: MeetingItem) => void;
}

export function MeetingCardItem({
  meeting,
  copiedId,
  onSelectMeeting,
  onCopyLink,
  onJoinCall,
}: MeetingCardItemProps) {
  const isLive = meeting.status === "in-progress";
  const isUpcoming = meeting.status === "upcoming";

  return (
    <div
      onClick={() => onSelectMeeting(meeting)}
      className="shadow-2xs group relative flex cursor-pointer flex-col justify-between gap-4 rounded-xl border border-neutral-200/80 bg-white p-4 transition-all hover:border-neutral-300 hover:shadow-sm sm:flex-row sm:items-center dark:border-neutral-800 dark:bg-neutral-900/90 dark:hover:border-neutral-700"
    >
      {/* Left / Info Section */}
      <div className="flex flex-1 flex-col gap-2">
        {/* Meta pills: time, status, location */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Time badge */}
          <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
            <Clock className="size-3.5 text-neutral-400" />
            {meeting.startTime} – {meeting.endTime}
            <span className="font-normal text-neutral-400">
              ({meeting.duration})
            </span>
          </span>

          <span className="text-neutral-300 dark:text-neutral-700">•</span>

          {/* Status badge */}
          {isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
              In progress
            </span>
          )}
          {isUpcoming && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/70 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
              <span className="size-1.5 rounded-full bg-blue-500" />
              Upcoming
            </span>
          )}
          {meeting.status === "completed" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              <CheckCircle2 className="size-3 text-neutral-400" />
              Completed
            </span>
          )}

          {/* Location / Room pill */}
          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100/70 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {meeting.locationType === "virtual" ? (
              <Video className="size-3 text-blue-500" />
            ) : (
              <MapPin className="size-3 text-amber-500" />
            )}
            {meeting.location}
            {meeting.roomDetails?.floor && (
              <span className="text-neutral-400">
                • {meeting.roomDetails.floor}
              </span>
            )}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-base font-semibold text-neutral-900 transition-colors group-hover:text-blue-600 dark:text-neutral-100 dark:group-hover:text-blue-400">
            {meeting.title}
          </h3>
          {meeting.description && (
            <p className="mt-1 line-clamp-2 max-w-2xl text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              {meeting.description}
            </p>
          )}
        </div>

        {/* Tags */}
        {meeting.tags && meeting.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {meeting.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-neutral-200/70 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right Section: Attendees & Quick Actions */}
      <div className="flex flex-row items-center justify-between gap-4 border-t border-neutral-100 pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
        {/* Attendees Avatars */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 overflow-hidden">
            {meeting.attendees.slice(0, 4).map((att, idx) => (
              <UserAvatar
                key={idx}
                user={{ name: att.name, email: att.email, image: att.avatar }}
                className="size-6.5 ring-2 ring-white dark:ring-neutral-900"
              />
            ))}
          </div>
          {meeting.attendees.length > 4 && (
            <span className="text-[11px] font-medium text-neutral-500">
              +{meeting.attendees.length - 4}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Copy Link button */}
          <button
            type="button"
            title="Copy meeting link"
            onClick={(e) => onCopyLink(e, meeting)}
            className="size-7.5 flex items-center justify-center rounded-lg border border-neutral-200/80 bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            {copiedId === meeting.id ? (
              <Check className="size-3.5 text-emerald-600" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>

          {/* Join Call / View Room */}
          {meeting.locationType === "virtual" || meeting.meetingUrl ? (
            <Button
              size="sm"
              onClick={(e) => onJoinCall(e, meeting)}
              className={`h-7.5 shadow-2xs gap-1.5 rounded-lg px-3 text-xs font-semibold ${
                isLive
                  ? "animate-pulse bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                  : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
              }`}
            >
              <Video className="size-3.5" />
              Join call
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onSelectMeeting(meeting);
              }}
              className="h-7.5 gap-1 rounded-lg px-2.5 text-xs font-medium"
            >
              <MapPin className="size-3.5 text-amber-500" />
              Room details
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
