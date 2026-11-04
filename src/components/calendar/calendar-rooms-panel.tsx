"use client";

import * as React from "react";
import { Building2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Switch } from "@/components/ui/switch";
import { CalendarPanelCard } from "./calendar-panel-card";
import type { CalendarAttendeeItem } from "./calendar-attendee-stack";

interface CalendarRoomsPanelProps {
  selectedAttendees: CalendarAttendeeItem[];
  onToggleAttendee: (item: CalendarAttendeeItem) => void;
}

export function CalendarRoomsPanel({
  selectedAttendees,
  onToggleAttendee,
}: CalendarRoomsPanelProps): React.ReactElement {
  const [rooms, setRooms] = React.useState<CalendarAttendeeItem[]>([]);

  React.useEffect(() => {
    let active = true;
    apiClient.rooms
      .list()
      .then((list) => {
        if (!active) return;
        setRooms(
          list.map((room) => ({
            id: room.id,
            name: room.name,
            email: room.email,
            image: null,
            type: "room",
            details: `${room.building || "Main Office"} · ${room.capacity} seats`,
          })),
        );
      })
      .catch(() => {
        if (active) setRooms([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedIds = React.useMemo(
    () => new Set(selectedAttendees.map((item) => item.id)),
    [selectedAttendees],
  );

  return (
    <CalendarPanelCard title="Rooms" meta={`${rooms.length}`}>
      <div className="space-y-0.5">
        {rooms.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            No rooms found
          </p>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-muted/60"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Building2 aria-hidden className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{room.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {room.details}
                </p>
              </div>
              <Switch
                checked={selectedIds.has(room.id)}
                onCheckedChange={() => onToggleAttendee(room)}
                aria-label={`Include ${room.name}`}
              />
            </div>
          ))
        )}
      </div>
    </CalendarPanelCard>
  );
}
