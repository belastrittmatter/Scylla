"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MeetingItem } from "@/mock-data/meetings-data";
import { copyToClipboard } from "@/lib/clipboard";
import { MeetingCardItem } from "./meeting-card-item";

interface MeetingsListViewProps {
  meetings: MeetingItem[];
  searchQuery: string;
  onOpenAddMeeting: () => void;
  onSelectMeeting: (meeting: MeetingItem) => void;
}

type MeetingStatusFilter =
  "all" | "today" | "upcoming" | "completed" | "room" | "virtual";

export function MeetingsListView({
  meetings,
  searchQuery,
  onOpenAddMeeting,
  onSelectMeeting,
}: MeetingsListViewProps) {
  const [statusFilter, setStatusFilter] =
    React.useState<MeetingStatusFilter>("all");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Benchmark today = 2025-01-10
  const benchmarkTodayStr = "2025-01-10";

  // Filter meetings
  const filteredMeetings = React.useMemo(() => {
    return meetings.filter((meeting) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = meeting.title.toLowerCase().includes(q);
        const matchDesc =
          meeting.description?.toLowerCase().includes(q) ?? false;
        const matchLoc = meeting.location.toLowerCase().includes(q);
        const matchOrg = meeting.organizer.name.toLowerCase().includes(q);
        const matchAtt = meeting.attendees.some((a) =>
          a.name.toLowerCase().includes(q),
        );
        if (!matchTitle && !matchDesc && !matchLoc && !matchOrg && !matchAtt) {
          return false;
        }
      }

      // Status / category filter
      if (statusFilter === "today") {
        return meeting.date === benchmarkTodayStr;
      }
      if (statusFilter === "upcoming") {
        return (
          meeting.status === "upcoming" || meeting.status === "in-progress"
        );
      }
      if (statusFilter === "completed") {
        return meeting.status === "completed";
      }
      if (statusFilter === "room") {
        return meeting.locationType === "room";
      }
      if (statusFilter === "virtual") {
        return meeting.locationType === "virtual";
      }

      return true;
    });
  }, [meetings, searchQuery, statusFilter]);

  // Group filtered meetings by date
  const groupedMeetings = React.useMemo(() => {
    const groups: Record<string, MeetingItem[]> = {};

    // Sort meetings by date then start time
    const sorted = [...filteredMeetings].sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.startTime.localeCompare(b.startTime);
    });

    for (const m of sorted) {
      if (!groups[m.date]) {
        groups[m.date] = [];
      }
      groups[m.date].push(m);
    }

    return Object.entries(groups).map(([dateStr, items]) => ({
      dateStr,
      date: parseISO(dateStr),
      items,
    }));
  }, [filteredMeetings]);

  const handleCopyLink = async (e: React.MouseEvent, meeting: MeetingItem) => {
    e.stopPropagation();
    const link =
      meeting.meetingUrl || `https://meet.google.com/room/${meeting.id}`;
    const ok = await copyToClipboard(link);
    if (ok) {
      setCopiedId(meeting.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleJoinCall = (e: React.MouseEvent, meeting: MeetingItem) => {
    e.stopPropagation();
    if (meeting.meetingUrl) {
      window.open(meeting.meetingUrl, "_blank", "noopener,noreferrer");
    } else {
      onSelectMeeting(meeting);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-neutral-50/60 p-4 sm:p-6 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        {/* Header toolbar with filters and stats */}
        <div className="flex flex-col justify-between gap-3 border-b border-neutral-200/80 pb-4 sm:flex-row sm:items-center dark:border-neutral-800">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All meetings" },
              { id: "today", label: "Today (Jan 10)" },
              { id: "upcoming", label: "Upcoming" },
              { id: "completed", label: "Completed" },
              { id: "room", label: "Meeting rooms" },
              { id: "virtual", label: "Virtual calls" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id as MeetingStatusFilter)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  statusFilter === f.id
                    ? "shadow-2xs bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "border border-neutral-200/80 bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Showing{" "}
              <strong className="font-semibold text-neutral-800 dark:text-neutral-200">
                {filteredMeetings.length}
              </strong>{" "}
              {filteredMeetings.length === 1 ? "meeting" : "meetings"}
            </span>
            <Button
              size="sm"
              onClick={onOpenAddMeeting}
              className="shadow-2xs h-8 gap-1.5 rounded-lg bg-neutral-900 px-3 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
            >
              <Plus className="size-3.5" />
              Schedule meeting
            </Button>
          </div>
        </div>

        {/* Grouped list of meetings */}
        {groupedMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900/50">
            <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800">
              <CalendarIcon className="size-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              No meetings found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-neutral-500">
              {searchQuery
                ? `No meetings match "${searchQuery}". Try a different keyword.`
                : "No meetings found in this view filter."}
            </p>
            <Button
              size="sm"
              onClick={onOpenAddMeeting}
              className="mt-4 h-8 gap-1.5 rounded-lg bg-neutral-900 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
            >
              <Plus className="size-3.5" />
              Schedule a meeting
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {groupedMeetings.map(({ dateStr, date, items }) => {
              const isBenchmarkToday = dateStr === benchmarkTodayStr;
              const formattedDate = format(date, "EEEE, MMMM d, yyyy");

              return (
                <div key={dateStr} className="flex flex-col gap-3">
                  {/* Date section header */}
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {formattedDate}
                      </h2>
                      {isBenchmarkToday && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          Today
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      {items.length}{" "}
                      {items.length === 1 ? "meeting" : "meetings"}
                    </span>
                  </div>

                  {/* Meetings cards for this date */}
                  <div className="grid grid-cols-1 gap-3">
                    {items.map((meeting) => (
                      <MeetingCardItem
                        key={meeting.id}
                        meeting={meeting}
                        copiedId={copiedId}
                        onSelectMeeting={onSelectMeeting}
                        onCopyLink={handleCopyLink}
                        onJoinCall={handleJoinCall}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
