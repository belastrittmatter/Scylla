"use client";

import * as React from "react";
import { VisualTimelineScheduler } from "@/components/calendar/visual-timeline-scheduler";

export default function TimelinePage() {
  const [selectedRoomId, setSelectedRoomId] = React.useState("room-saigon");
  const [selectedStartMin, setSelectedStartMin] = React.useState(540); // 09:00
  const [selectedEndMin, setSelectedEndMin] = React.useState(600); // 10:00
  const [selectedParticipants, setSelectedParticipants] = React.useState<string[]>([
    "user-self",
    "user-jordan-lee",
  ]);

  const handleToggleParticipant = (id: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectTimeSlot = (startMin: number, endMin: number) => {
    setSelectedStartMin(startMin);
    setSelectedEndMin(endMin);
  };

  return (
    <main className="min-h-screen bg-neutral-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <VisualTimelineScheduler
          selectedRoomId={selectedRoomId}
          onSelectRoom={setSelectedRoomId}
          selectedStartMin={selectedStartMin}
          selectedEndMin={selectedEndMin}
          onSelectTimeSlot={handleSelectTimeSlot}
          selectedParticipants={selectedParticipants}
          onToggleParticipant={handleToggleParticipant}
        />
      </div>
    </main>
  );
}
