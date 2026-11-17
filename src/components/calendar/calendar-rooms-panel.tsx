"use client";

import * as React from "react";
import { Building2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { CalendarPanelCard, CalendarPanelShowAll } from "./calendar-panel-card";
import { CalendarSelectableRow } from "./calendar-selectable-row";
import type { CalendarAttendeeItem } from "./calendar-attendee-types";

/** Rooms listed before "Show all"; selected rooms always stay visible. */
const COLLAPSED_ROOM_COUNT = 5;

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
  const [showAll, setShowAll] = React.useState(false);

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
            // No building on record: the row shows seats only.
            details: room.building || undefined,
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

  const hasSelection = rooms.some((room) => selectedIds.has(room.id));

  const orderedRooms = [...rooms].sort(
    (a, b) => Number(selectedIds.has(b.id)) - Number(selectedIds.has(a.id)),
  );
  const listedRooms = showAll
    ? orderedRooms
    : orderedRooms.filter(
        (room, index) =>
          index < COLLAPSED_ROOM_COUNT || selectedIds.has(room.id),
      );
  const hiddenCount = orderedRooms.length - listedRooms.length;

  return (
    <CalendarPanelCard
      title="Rooms"
      meta={`${rooms.length} ${rooms.length === 1 ? "room" : "rooms"}`}
      active={hasSelection}
      defaultOpen={defaultOpen}
    >
      <div className="space-y-0.5">
        {orderedRooms.length === 0 ? (
          <p className="px-1.5 py-2 text-xs text-muted-foreground">
            No rooms found
          </p>
        ) : (
          listedRooms.map((room) => (
            <CalendarSelectableRow
              key={room.id}
              label={room.name}
              icon={Building2}
              checked={selectedIds.has(room.id)}
              onToggle={() => onToggleAttendee(room)}
              sublabel={
                <>
                  {room.details}
                  {room.capacity !== undefined && (
                    <>
                      {room.details && <span aria-hidden> · </span>}
                      <span className="font-code text-[11px] tabular-nums">
                        {room.capacity} {room.capacity === 1 ? "seat" : "seats"}
                      </span>
                    </>
                  )}
                </>
              }
            />
          ))
        )}
        {hiddenCount > 0 && (
          <CalendarPanelShowAll
            noun="rooms"
            hiddenCount={hiddenCount}
            onShowAll={() => setShowAll(true)}
          />
        )}
      </div>
    </CalendarPanelCard>
  );
}
