"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Video, Building2 } from "lucide-react";
import type { MeetingRoom } from "@/db/schema";

interface CalendarLocationSectionProps {
  locationType: "virtual" | "room";
  onLocationTypeChange: (type: "virtual" | "room") => void;
  selectedRoomId: string;
  onRoomChange: (roomId: string) => void;
  rooms: MeetingRoom[];
  disabled?: boolean;
}

export function CalendarLocationSection({
  locationType,
  onLocationTypeChange,
  selectedRoomId,
  onRoomChange,
  rooms,
  disabled,
}: CalendarLocationSectionProps) {
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const groupedRooms = React.useMemo(() => {
    const map = new Map<string, MeetingRoom[]>();
    for (const r of rooms) {
      const loc = (r.officeLocation || "hcm").toUpperCase();
      if (!map.has(loc)) map.set(loc, []);
      map.get(loc)!.push(r);
    }
    return map;
  }, [rooms]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
          Location
        </Label>
        <div className="inline-flex rounded-md border border-neutral-200 bg-neutral-100/80 p-0.5 dark:border-neutral-800 dark:bg-neutral-900">
          <Button
            type="button"
            variant={locationType === "virtual" ? "default" : "ghost"}
            size="sm"
            disabled={disabled}
            onClick={() => onLocationTypeChange("virtual")}
            className="h-6 cursor-pointer gap-1.5 px-2.5 text-[11px]"
          >
            <Video className="size-3" />
            <span>Google Meet</span>
          </Button>

          <Button
            type="button"
            variant={locationType === "room" ? "default" : "ghost"}
            size="sm"
            disabled={disabled}
            onClick={() => onLocationTypeChange("room")}
            className="h-6 cursor-pointer gap-1.5 px-2.5 text-[11px]"
          >
            <Building2 className="size-3" />
            <span>Room</span>
          </Button>
        </div>
      </div>

      {locationType === "room" && (
        <Select
          value={selectedRoomId}
          onValueChange={(val) => {
            if (val) onRoomChange(val);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="h-8.5 w-full text-xs">
            <SelectValue placeholder="Select room">
              {selectedRoom
                ? `[${(selectedRoom.officeLocation || "hcm").toUpperCase()}] ${selectedRoom.name} (${selectedRoom.capacity} seats)`
                : "Select room"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Array.from(groupedRooms.entries()).map(([loc, roomList]) => (
              <SelectGroup key={loc}>
                <SelectLabel className="text-muted-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">
                  {loc} Office
                </SelectLabel>
                {roomList.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <div className="flex w-full items-center justify-between gap-2 text-xs">
                      <span>
                        [{loc}] {r.name}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        {r.capacity} seats
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
