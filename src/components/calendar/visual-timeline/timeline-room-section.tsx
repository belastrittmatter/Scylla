"use client";

import * as React from "react";
import { Building, RefreshCw } from "lucide-react";
import type { RoomSchedule } from "./timeline-types";
import { HOURS, getPercent } from "./timeline-types";

interface TimelineRoomSectionProps {
  rooms: RoomSchedule[];
  selectedRoomId: string;
  onSelectRoom: (roomId: string) => void;
  selectedStartMin: number;
  selectedEndMin: number;
  onTimelineClick: (
    e: React.MouseEvent<HTMLDivElement>,
    roomId?: string,
  ) => void;
  isSyncingRooms: boolean;
  handleSyncRooms: () => void;
}

export function TimelineRoomSection({
  rooms,
  selectedRoomId,
  onSelectRoom,
  selectedStartMin,
  selectedEndMin,
  onTimelineClick,
  isSyncingRooms,
  handleSyncRooms,
}: TimelineRoomSectionProps) {
  return (
    <div className="mt-8 space-y-3 border-t border-neutral-200/80 pt-6 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          <Building className="size-3.5 text-indigo-500" />
          <span>Meeting Rooms (Google Calendar Resources)</span>
        </div>

        <button
          type="button"
          disabled={isSyncingRooms}
          onClick={handleSyncRooms}
          className="inline-flex items-center gap-1 rounded-md border border-neutral-200/90 bg-neutral-50 px-2 py-1 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
        >
          <RefreshCw
            className={`size-3 ${isSyncingRooms ? "animate-spin text-blue-600" : ""}`}
          />
          <span>
            {isSyncingRooms
              ? "Syncing Rooms..."
              : "Sync Rooms (/api/rooms/sync)"}
          </span>
        </button>
      </div>

      {rooms.map((room) => {
        const isChosen = selectedRoomId === room.id;

        return (
          <div key={room.id} className="flex items-center gap-3">
            <div
              onClick={() => onSelectRoom(room.id)}
              className="flex w-56 shrink-0 cursor-pointer items-center justify-between rounded-lg p-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {room.name}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400">
                  Cap: {room.capacity} • {room.floor}
                </p>
              </div>

              {isChosen ? (
                <span className="shadow-2xs rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  Chosen
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRoom(room.id);
                  }}
                  className="rounded-md border border-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-700"
                >
                  Choose
                </button>
              )}
            </div>

            <div
              onClick={(e) => onTimelineClick(e, room.id)}
              className={`relative h-9 flex-1 cursor-pointer overflow-hidden rounded-lg border transition-all ${
                isChosen
                  ? "border-blue-400 bg-blue-50/30 ring-1 ring-blue-400/40 dark:border-blue-700 dark:bg-blue-950/20"
                  : "border-neutral-200/90 bg-neutral-100/70 dark:border-neutral-800 dark:bg-neutral-800/40"
              }`}
            >
              {HOURS.slice(1, -1).map((hour) => (
                <div
                  key={hour}
                  className="absolute inset-y-0 border-r border-neutral-200/50 dark:border-neutral-700/30"
                  style={{ left: `${((hour - 8) / 10) * 100}%` }}
                />
              ))}

              {room.bookedSlots.map((booked, idx) => {
                const left = getPercent(booked.startMin);
                const width = getPercent(booked.endMin) - left;
                return (
                  <div
                    key={idx}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    className="shadow-2xs absolute inset-y-1 flex items-center justify-center truncate rounded-md bg-indigo-600/90 px-1 text-[10px] font-semibold text-white transition-colors hover:bg-indigo-700"
                    title={booked.label}
                  >
                    {booked.label}
                  </div>
                );
              })}

              {isChosen && (
                <div
                  style={{
                    left: `${getPercent(selectedStartMin)}%`,
                    width: `${getPercent(selectedEndMin) - getPercent(selectedStartMin)}%`,
                  }}
                  className="pointer-events-none absolute inset-y-0 border-2 border-dashed border-amber-500 bg-amber-400/25"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
