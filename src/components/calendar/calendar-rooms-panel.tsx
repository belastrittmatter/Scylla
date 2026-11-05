"use client";

import * as React from "react";
import { Building2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { CalendarPanelCard } from "./calendar-panel-card";
import { CalendarSelectableRow } from "./calendar-selectable-row";
import type { CalendarAttendeeItem } from "./calendar-attendee-types";

interface CalendarRoomsPanelProps {
  selectedAttendees: CalendarAttendeeItem[];
  onToggleAttendee: (item: CalendarAttendeeItem) => void;
  defaultOpen?: boolean;
}

export function CalendarRoomsPanel({
  selectedAttendees,
  onToggleAttendee,
  defaultOpen,
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
            details: room.building || "Main Office",
            capacity: room.capacity,
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

  const orderedRooms = [...rooms].sort(
    (a, b) => Number(selectedIds.has(b.id)) - Number(selectedIds.has(a.id)),
  );

  return (
    <CalendarPanelCard
      title="Rooms"
      meta={`${rooms.length}`}
      icon={Building2}
      defaultOpen={defaultOpen}
      bodyClassName="max-h-[260px] overflow-y-auto"
    >
      <div className="space-y-0.5">
        {orderedRooms.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            No rooms found
          </p>
        ) : (
          orderedRooms.map((room) => (
            <CalendarSelectableRow
              key={room.id}
              label={room.name}
              icon={Building2}
              checked={selectedIds.has(room.id)}
              onToggle={() => onToggleAttendee(room)}
              meta={
                room.capacity !== undefined ? String(room.capacity) : undefined
              }
              sublabel={room.details}
            />
          ))
        )}
      </div>
    </CalendarPanelCard>
  );
}
