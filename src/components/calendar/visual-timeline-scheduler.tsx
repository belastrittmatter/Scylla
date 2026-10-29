"use client";

import * as React from "react";
import { useUserSearch } from "@/hooks/use-user-search";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import type { Teammate } from "@/services/user";
import type {
  ParticipantSchedule,
  TimeInterval,
} from "./visual-timeline/timeline-types";
import {
  DAY_START_MIN,
  DAY_END_MIN,
  TOTAL_MINUTES,
  HOURS,
  MOCK_PARTICIPANTS,
  MOCK_ROOM_SCHEDULES,
} from "./visual-timeline/timeline-types";
import { TimelineHeader } from "./visual-timeline/timeline-header";
import { TimelineParticipantSection } from "./visual-timeline/timeline-participant-section";
import { TimelineSharedFreeSection } from "./visual-timeline/timeline-shared-free-section";
import { TimelineRoomSection } from "./visual-timeline/timeline-room-section";

export type {
  TimeInterval,
  ParticipantSchedule,
  RoomSchedule,
} from "./visual-timeline/timeline-types";
export {
  MOCK_PARTICIPANTS,
  MOCK_ROOM_SCHEDULES,
} from "./visual-timeline/timeline-types";

interface VisualTimelineSchedulerProps {
  selectedRoomId: string;
  onSelectRoom: (roomId: string) => void;
  selectedStartMin: number;
  selectedEndMin: number;
  onSelectTimeSlot: (startMin: number, endMin: number) => void;
  selectedParticipants: string[];
  onToggleParticipant: (id: string) => void;
}

export function VisualTimelineScheduler({
  selectedRoomId,
  onSelectRoom,
  selectedStartMin,
  selectedEndMin,
  onSelectTimeSlot,
  selectedParticipants,
  onToggleParticipant,
}: VisualTimelineSchedulerProps) {
  const [participants, setParticipants] =
    React.useState<ParticipantSchedule[]>(MOCK_PARTICIPANTS);
  const { data: session } = useSession();
  const userSearch = useUserSearch({ limit: 5 });
  const [isSyncingRooms, setIsSyncingRooms] = React.useState(false);
  const [isComputingSlots, setIsComputingSlots] = React.useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);

  const userSearchTerm = userSearch.query;
  const handleSearchUsers = userSearch.setQuery;
  const searchResults = userSearch.results;
  const isSearchingUsers = userSearch.isLoading;

  React.useEffect(() => {
    if (session?.user) {
      queueMicrotask(() => {
        setParticipants((prev) => {
          const userEmail = session.user.email;
          const exists = prev.some((p) => p.email === userEmail);
          if (exists) {
            return prev.map((p) =>
              p.email === userEmail
                ? {
                    ...p,
                    name: session.user.name || p.name,
                    avatar: session.user.image ?? p.avatar,
                  }
                : p,
            );
          }
          return [
            {
              id: session.user.id || "usr_session_host",
              name: session.user.name || "You (Host)",
              email: session.user.email,
              avatar: session.user.image ?? undefined,
              busySlots: [],
            },
            ...prev,
          ];
        });
      });
    }
  }, [session?.user]);

  const handleSyncRooms = async () => {
    setIsSyncingRooms(true);
    try {
      const res = await apiClient.rooms.sync();
      toast.success(
        `Google Workspace room catalog synced! (${res.rooms.length} rooms)`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to sync room catalog",
      );
    } finally {
      setIsSyncingRooms(false);
    }
  };

  const handleAddTeammate = (teammate: Teammate) => {
    const existing = participants.find(
      (p) => p.email.toLowerCase() === teammate.email.toLowerCase(),
    );
    if (existing) {
      if (!selectedParticipants.includes(existing.id)) {
        onToggleParticipant(existing.id);
      }
      toast.info(`${teammate.name} is already in the scheduler`);
      setIsAddUserOpen(false);
      return;
    }

    const newParticipant: ParticipantSchedule = {
      id: teammate.id,
      name: teammate.name,
      email: teammate.email,
      avatar: teammate.image ?? undefined,
      busySlots: [
        { startMin: 11 * 60, endMin: 12 * 60, label: "Busy: 11:00-12:00" },
      ],
    };

    setParticipants((prev) => [...prev, newParticipant]);
    onToggleParticipant(newParticipant.id);
    setIsAddUserOpen(false);
    userSearch.clear();
    toast.success(`Added ${teammate.name} to schedule calculation`);
  };

  const handleFindSlotsApi = async () => {
    setIsComputingSlots(true);
    try {
      const activeEmails = participants
        .filter((p) => selectedParticipants.includes(p.id))
        .map((p) => p.email);

      if (activeEmails.length === 0) {
        toast.error("Please select at least one participant");
        return;
      }

      const slots = await apiClient.slots.find({
        attendees: activeEmails,
        startDate: "2025-01-10T08:00:00.000Z",
        endDate: "2025-01-10T18:00:00.000Z",
        durationMinutes: 60,
      });

      const openSlots = slots.filter((s) => s.available);
      if (openSlots.length > 0) {
        const firstSlot = openSlots[0];
        const sDate = new Date(firstSlot.start);
        const eDate = new Date(firstSlot.end);
        const startMin = sDate.getUTCHours() * 60 + sDate.getUTCMinutes();
        const endMin = eDate.getUTCHours() * 60 + eDate.getUTCMinutes();

        onSelectTimeSlot(startMin, endMin);
        toast.success(
          `Found ${openSlots.length} conflict-free slots via /api/slots/find! Selected ${firstSlot.start.slice(11, 16)}–${firstSlot.end.slice(11, 16)}.`,
        );
      } else {
        toast.info("No open slots found for all chosen participants");
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Error querying backend slot finder",
      );
    } finally {
      setIsComputingSlots(false);
    }
  };

  const sharedFreeIntervals = React.useMemo(() => {
    let freeIntervals: TimeInterval[] = [
      { startMin: DAY_START_MIN, endMin: DAY_END_MIN },
    ];
    const activeParticipants = participants.filter((p) =>
      selectedParticipants.includes(p.id),
    );

    for (const p of activeParticipants) {
      for (const busy of p.busySlots) {
        const nextFree: TimeInterval[] = [];
        for (const free of freeIntervals) {
          if (busy.endMin <= free.startMin || busy.startMin >= free.endMin) {
            nextFree.push(free);
          } else {
            if (busy.startMin > free.startMin) {
              nextFree.push({ startMin: free.startMin, endMin: busy.startMin });
            }
            if (busy.endMin < free.endMin) {
              nextFree.push({ startMin: busy.endMin, endMin: free.endMin });
            }
          }
        }
        freeIntervals = nextFree;
      }
    }

    return freeIntervals.filter((i) => i.endMin - i.startMin >= 15);
  }, [participants, selectedParticipants]);

  const handleTimelineClick = (
    e: React.MouseEvent<HTMLDivElement>,
    roomId?: string,
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const rawMinutes = DAY_START_MIN + ratio * TOTAL_MINUTES;

    const snappedStart = Math.floor(rawMinutes / 15) * 15;
    const duration = 60;
    const snappedEnd = Math.min(DAY_END_MIN, snappedStart + duration);

    onSelectTimeSlot(snappedStart, snappedEnd);
    if (roomId) {
      onSelectRoom(roomId);
    }
  };

  return (
    <div className="flex w-full flex-col rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <TimelineHeader
        selectedStartMin={selectedStartMin}
        selectedEndMin={selectedEndMin}
      />

      <div className="relative mt-6 select-none overflow-x-auto">
        <div className="min-w-[850px]">
          <div className="flex items-center pb-3">
            <div className="w-56 shrink-0 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Resource / Person
            </div>
            <div className="relative flex-1">
              <div className="relative flex w-full justify-between text-[11px] font-semibold text-neutral-500">
                {HOURS.map((hour) => (
                  <span
                    key={hour}
                    className="relative -translate-x-1/2"
                    style={{
                      left: `${((hour - 8) / 10) * 100}%`,
                      position: "absolute",
                    }}
                  >
                    {hour.toString().padStart(2, "0")}:00
                  </span>
                ))}
              </div>
            </div>
          </div>

          <TimelineParticipantSection
            participants={participants}
            selectedParticipants={selectedParticipants}
            onToggleParticipant={onToggleParticipant}
            selectedStartMin={selectedStartMin}
            selectedEndMin={selectedEndMin}
            onTimelineClick={handleTimelineClick}
            isAddUserOpen={isAddUserOpen}
            setIsAddUserOpen={setIsAddUserOpen}
            userSearchTerm={userSearchTerm}
            handleSearchUsers={handleSearchUsers}
            isSearchingUsers={isSearchingUsers}
            searchResults={searchResults}
            handleAddTeammate={handleAddTeammate}
          />

          <TimelineSharedFreeSection
            sharedFreeIntervals={sharedFreeIntervals}
            isComputingSlots={isComputingSlots}
            handleFindSlotsApi={handleFindSlotsApi}
            selectedStartMin={selectedStartMin}
            selectedEndMin={selectedEndMin}
            onTimelineClick={handleTimelineClick}
            onSelectTimeSlot={onSelectTimeSlot}
          />

          <TimelineRoomSection
            rooms={MOCK_ROOM_SCHEDULES}
            selectedRoomId={selectedRoomId}
            onSelectRoom={onSelectRoom}
            selectedStartMin={selectedStartMin}
            selectedEndMin={selectedEndMin}
            onTimelineClick={handleTimelineClick}
            isSyncingRooms={isSyncingRooms}
            handleSyncRooms={handleSyncRooms}
          />
        </div>
      </div>
    </div>
  );
}
