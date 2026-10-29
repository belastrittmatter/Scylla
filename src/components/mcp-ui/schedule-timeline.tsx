"use client";

import { DoorOpen, Users } from "lucide-react";
import React, { useRef, useState } from "react";
import {
  type BusyInterval,
  fmtTime,
  type McpPerson,
  type ScheduleRoom,
  type ScheduleSlot,
} from "@/components/mcp-ui/mcp-ui-types";
import {
  findClosestSlotByClientX,
  getIctMinutes,
  getInitials,
  getTimelinePercent,
  TIMELINE_HOURS,
} from "@/components/mcp-ui/schedule-helpers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ScheduleTimelineProps {
  readonly participants: readonly McpPerson[];
  readonly selectedRoom: ScheduleRoom | null;
  readonly roomBusyList: readonly BusyInterval[];
  readonly sharedFreeBands: readonly BusyInterval[];
  readonly bookedIntervals: readonly BusyInterval[];
  readonly openSlots: readonly ScheduleSlot[];
  readonly allSlots: readonly ScheduleSlot[];
  readonly selectedSlot: ScheduleSlot | null;
  readonly isSyncing: boolean;
  readonly onSelectSlot: (slot: ScheduleSlot) => void;
}

function renderHourRuler(
  label: string,
  extraProps?: Record<string, string>,
): React.ReactElement {
  return (
    <div {...extraProps} className="flex items-center gap-3 py-0.5">
      <div className="text-muted-foreground w-40 shrink-0 text-[11px] font-semibold uppercase tracking-wider">
        {label}
      </div>
      <div className="text-muted-foreground relative h-4 flex-1 text-[10px] font-medium tabular-nums">
        {TIMELINE_HOURS.map((h) => (
          <span
            key={h}
            style={{ left: `${((h - 8) / 10) * 100}%` }}
            className="absolute -translate-x-1/2"
          >
            {String(h).padStart(2, "0")}:00
          </span>
        ))}
      </div>
    </div>
  );
}

function renderTrack(
  busyList: readonly BusyInterval[],
  sharedFreeBands: readonly BusyInterval[],
  isSharedRow = false,
): React.ReactElement {
  const items = isSharedRow ? sharedFreeBands : busyList;
  return (
    <div className="border-border/80 bg-muted/20 relative h-8 w-full overflow-hidden rounded-md border">
      {TIMELINE_HOURS.slice(1, -1).map((h) => (
        <div
          key={h}
          className="border-border/40 pointer-events-none absolute inset-y-0 border-r"
          style={{ left: `${((h - 8) / 10) * 100}%` }}
        />
      ))}
      <div
        data-break-slot="true"
        style={{ left: "40%", width: "10%" }}
        title="12:00 – 13:00 Lunch Break (Bookable, outside regular hours)"
        className="border-border/80 bg-muted/70 text-muted-foreground/80 pointer-events-none absolute inset-y-0 flex items-center justify-center border-x border-dashed text-[9px] font-medium"
      >
        Break
      </div>
      {items.map((b, idx) => {
        const left = getTimelinePercent(getIctMinutes(b.start));
        const width = Math.max(
          1.5,
          getTimelinePercent(getIctMinutes(b.end)) - left,
        );
        return (
          <div
            key={isSharedRow ? b.start : `${b.start}-${idx}`}
            style={{ left: `${left}%`, width: `${width}%` }}
            title={`${isSharedRow ? "Available" : "Busy"}: ${fmtTime(b.start)} – ${fmtTime(b.end)}`}
            className={`pointer-events-none absolute inset-y-1.5 rounded-sm ${isSharedRow ? "bg-emerald-500/80" : "bg-destructive/85"}`}
          />
        );
      })}
    </div>
  );
}

export function ScheduleTimeline({
  participants,
  selectedRoom,
  roomBusyList,
  sharedFreeBands,
  bookedIntervals,
  openSlots,
  selectedSlot,
  isSyncing,
  onSelectSlot,
}: ScheduleTimelineProps): React.ReactElement {
  const [isDragging, setIsDragging] = useState(false);
  const tracksRef = useRef<HTMLDivElement | null>(null);

  const snapToClientX = (clientX: number) => {
    const el = tracksRef.current;
    if (!el || isSyncing || openSlots.length === 0) return;
    const rect = el.getBoundingClientRect();
    const snapped = findClosestSlotByClientX(
      clientX,
      rect.left,
      rect.width,
      openSlots,
    );
    if (snapped && snapped.start !== selectedSlot?.start) onSelectSlot(snapped);
  };

  const selLeft = selectedSlot
    ? getTimelinePercent(getIctMinutes(selectedSlot.start))
    : 0;
  const selWidth = selectedSlot
    ? Math.max(2, getTimelinePercent(getIctMinutes(selectedSlot.end)) - selLeft)
    : 0;
  const badgeText = selectedSlot
    ? `${fmtTime(selectedSlot.start)}–${fmtTime(selectedSlot.end)}`
    : "";

  return (
    <div className="border-border bg-card overflow-x-auto rounded-xl border p-3">
      <div className="min-w-[560px] space-y-2">
        {renderHourRuler("People / Timeline")}
        <div className="flex gap-3">
          <div className="flex w-40 shrink-0 flex-col gap-2">
            {participants.map((p) => (
              <div
                key={(p.email || p.name || "").toLowerCase()}
                data-calendar-column={p.name}
                className="flex h-8 items-center gap-2 truncate"
              >
                <Avatar size="sm">
                  <AvatarFallback className="text-[10px] font-bold">
                    {getInitials(p.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-xs font-medium">{p.name}</span>
              </div>
            ))}
            {selectedRoom && (
              <div
                data-calendar-column={selectedRoom.name}
                data-room-row="true"
                className="text-foreground flex h-8 items-center justify-between gap-2 truncate text-xs font-medium"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="border-border bg-muted/60 text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-md border">
                    <DoorOpen className="size-3.5" />
                  </span>
                  <span className="truncate">{selectedRoom.name}</span>
                </div>
                <span className="text-muted-foreground flex shrink-0 items-center gap-0.5 text-[10px] font-medium tabular-nums">
                  <Users className="size-2.5" />
                  {selectedRoom.capacity || 0}
                </span>
              </div>
            )}
            <div className="border-border/60 flex h-8 items-center gap-1.5 border-t pt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Common Free</span>
            </div>
          </div>

          <div
            ref={tracksRef}
            onPointerDown={(e) => {
              setIsDragging(true);
              e.currentTarget.setPointerCapture(e.pointerId);
              snapToClientX(e.clientX);
            }}
            onPointerMove={(e) => isDragging && snapToClientX(e.clientX)}
            onPointerUp={() => setIsDragging(false)}
            onPointerCancel={() => setIsDragging(false)}
            className="relative flex flex-1 cursor-pointer select-none flex-col gap-2"
          >
            {participants.map((p) => (
              <React.Fragment key={p.email || p.name}>
                {renderTrack(
                  [...(p.busy ?? []), ...bookedIntervals],
                  sharedFreeBands,
                )}
              </React.Fragment>
            ))}
            {selectedRoom && renderTrack(roomBusyList, sharedFreeBands)}
            <div className="border-border/60 border-t pt-1">
              {renderTrack([], sharedFreeBands, true)}
            </div>
            {selectedSlot && !isSyncing && (
              <div
                data-selected-slot-overlay="true"
                style={{ left: `${selLeft}%`, width: `${selWidth}%` }}
                className="shadow-xs pointer-events-none absolute inset-y-0 z-20 rounded-md border-2 border-amber-400 bg-amber-400/20 transition-[left,width] duration-150 ease-out"
              >
                <div className="shadow-2xs absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-amber-400 px-1 py-0.5 text-[9px] font-bold leading-none text-amber-950">
                  {badgeText}
                </div>
                {participants.length > 5 && (
                  <div className="shadow-2xs absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-amber-400 px-1 py-0.5 text-[9px] font-bold leading-none text-amber-950">
                    {badgeText}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {participants.length > 5 &&
          renderHourRuler("Hours", { "data-bottom-timeline-hours": "true" })}
      </div>
    </div>
  );
}
