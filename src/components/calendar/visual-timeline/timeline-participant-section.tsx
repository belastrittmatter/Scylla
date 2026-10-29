"use client";

import * as React from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Teammate } from "@/services/user";
import type { ParticipantSchedule } from "./timeline-types";
import { HOURS, getPercent } from "./timeline-types";

interface TimelineParticipantSectionProps {
  participants: ParticipantSchedule[];
  selectedParticipants: string[];
  onToggleParticipant: (id: string) => void;
  selectedStartMin: number;
  selectedEndMin: number;
  onTimelineClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  isAddUserOpen: boolean;
  setIsAddUserOpen: (open: boolean) => void;
  userSearchTerm: string;
  handleSearchUsers: (q: string) => void;
  isSearchingUsers: boolean;
  searchResults: Teammate[];
  handleAddTeammate: (teammate: Teammate) => void;
}

export function TimelineParticipantSection({
  participants,
  selectedParticipants,
  onToggleParticipant,
  selectedStartMin,
  selectedEndMin,
  onTimelineClick,
  isAddUserOpen,
  setIsAddUserOpen,
  userSearchTerm,
  handleSearchUsers,
  isSearchingUsers,
  searchResults,
  handleAddTeammate,
}: TimelineParticipantSectionProps) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          <span className="font-bold text-blue-500">👥</span>
          <span>Participants Availability</span>
          <span className="text-[10px] font-normal text-neutral-400">
            (Click to toggle in calculation)
          </span>
        </div>

        <Popover open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <PopoverTrigger
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-neutral-200/90 bg-neutral-50 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <Plus className="size-3" />
            <span>Add Teammate</span>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="end">
            <div className="space-y-2">
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Directory Search (/api/users/search)
              </p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Type name or email..."
                  value={userSearchTerm}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  className="h-8 w-full rounded-md border border-neutral-200 pl-7 pr-2 text-xs focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>
              <div className="max-h-40 space-y-1 overflow-y-auto pt-1">
                {isSearchingUsers ? (
                  <div className="flex items-center justify-center py-3 text-xs text-neutral-400">
                    <Loader2 className="mr-1 size-3.5 animate-spin" />
                    Searching directory...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((usr) => (
                    <div
                      key={usr.id}
                      onClick={() => handleAddTeammate(usr)}
                      className="flex cursor-pointer items-center justify-between rounded-md p-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          {usr.name}
                        </p>
                        <p className="truncate text-[10px] text-neutral-400">
                          {usr.email}
                        </p>
                      </div>
                      <Plus className="size-3.5 text-neutral-400" />
                    </div>
                  ))
                ) : userSearchTerm.trim() ? (
                  <p className="py-2 text-center text-[11px] text-neutral-400">
                    No teammates found
                  </p>
                ) : (
                  <p className="py-2 text-center text-[11px] text-neutral-400">
                    Search by name or email
                  </p>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {participants.map((participant) => {
        const isSelected = selectedParticipants.includes(participant.id);

        return (
          <div
            key={participant.id}
            className="flex items-center gap-3 transition-opacity"
            style={{ opacity: isSelected ? 1 : 0.45 }}
          >
            <div
              onClick={() => onToggleParticipant(participant.id)}
              className="flex w-56 shrink-0 cursor-pointer items-center justify-between rounded-lg p-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Avatar size="sm" className="size-7 shrink-0 text-[10px]">
                  {participant.avatar ? (
                    <AvatarImage
                      src={participant.avatar}
                      alt={participant.name}
                    />
                  ) : null}
                  <AvatarFallback className="bg-neutral-200 font-bold text-neutral-700">
                    {participant.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    {participant.name}
                  </p>
                  <p className="truncate text-[10px] text-neutral-400">
                    {participant.email}
                  </p>
                </div>
              </div>

              <span
                className={`flex size-4 items-center justify-center rounded-full border text-[9px] ${
                  isSelected
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-neutral-300 dark:border-neutral-700"
                }`}
              >
                {isSelected ? "✓" : ""}
              </span>
            </div>

            <div
              onClick={onTimelineClick}
              className="relative h-9 flex-1 cursor-pointer overflow-hidden rounded-lg border border-neutral-200/90 bg-neutral-100/70 dark:border-neutral-800 dark:bg-neutral-800/40"
            >
              {HOURS.slice(1, -1).map((hour) => (
                <div
                  key={hour}
                  className="absolute inset-y-0 border-r border-neutral-200/50 dark:border-neutral-700/30"
                  style={{ left: `${((hour - 8) / 10) * 100}%` }}
                />
              ))}

              {participant.busySlots.map((busy, idx) => {
                const left = getPercent(busy.startMin);
                const width = getPercent(busy.endMin) - left;
                return (
                  <div
                    key={idx}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    className="shadow-2xs absolute inset-y-1 flex items-center justify-center truncate rounded-md bg-rose-500/85 px-1.5 text-[10px] font-semibold text-white transition-colors hover:bg-rose-600"
                    title={busy.label}
                  >
                    {busy.label}
                  </div>
                );
              })}

              <div
                style={{
                  left: `${getPercent(selectedStartMin)}%`,
                  width: `${getPercent(selectedEndMin) - getPercent(selectedStartMin)}%`,
                }}
                className="pointer-events-none absolute inset-y-0 border-2 border-dashed border-amber-500 bg-amber-400/20"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
