"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HCM_MEETING_ROOMS } from "@/constants/rooms";
import type { MeetingItem } from "@/mock-data/meetings-data";

interface MeetingAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMeeting: (meeting: MeetingItem) => void;
}

export function MeetingAddDialog({ open, onOpenChange, onAddMeeting }: MeetingAddDialogProps) {
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState("2025-01-10");
  const [startTime, setStartTime] = React.useState("14:00");
  const [endTime, setEndTime] = React.useState("15:00");
  const [locationType, setLocationType] = React.useState<"room" | "virtual">("room");
  const [selectedRoomId, setSelectedRoomId] = React.useState(HCM_MEETING_ROOMS[0].id);
  const [virtualPlatform, setVirtualPlatform] = React.useState("Google Meet");
  const [description, setDescription] = React.useState("");
  const [attendeesInput, setAttendeesInput] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Format times into AM/PM
    const formatTimeDisplay = (time24: string) => {
      const [hStr, mStr] = time24.split(":");
      let h = parseInt(hStr, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h.toString().padStart(2, "0")}:${mStr} ${ampm}`;
    };

    const formattedStart = formatTimeDisplay(startTime);
    const formattedEnd = formatTimeDisplay(endTime);

    const selectedRoom = HCM_MEETING_ROOMS.find((r) => r.id === selectedRoomId);

    const attendeesList = attendeesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((email) => ({
        name: email.split("@")[0].replace(".", " "),
        email,
      }));

    if (attendeesList.length === 0) {
      attendeesList.push({
        name: "Team Member",
        email: "team@example.com",
      });
    }

    const newMeeting: MeetingItem = {
      id: `meet-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      startTime: formattedStart,
      endTime: formattedEnd,
      duration: "1 hour",
      location: locationType === "room" ? selectedRoom?.name || "Meeting Room" : virtualPlatform,
      locationType,
      meetingUrl:
        locationType === "virtual"
          ? `https://meet.google.com/new-${Date.now().toString(36)}`
          : undefined,
      color: "#0284c7",
      status: "upcoming",
      organizer: {
        name: "Alex Morgan",
        email: "alex.morgan@example.com",
        role: "Fullstack Engineer",
      },
      attendees: [
        { name: "Alex Morgan", email: "alex.morgan@example.com", role: "Organizer" },
        ...attendeesList,
      ],
      roomDetails:
        locationType === "room" && selectedRoom
          ? {
              name: selectedRoom.name,
              capacity: selectedRoom.capacity,
              floor: selectedRoom.location,
              facilities: selectedRoom.facilities,
            }
          : undefined,
      tags: ["Meeting"],
    };

    onAddMeeting(newMeeting);
    onOpenChange(false);

    // Reset fields
    setTitle("");
    setDescription("");
    setAttendeesInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Schedule a Meeting</DialogTitle>
          <DialogDescription className="text-xs text-neutral-500">
            Book a physical meeting room or create a virtual meeting link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4 text-xs">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300">
              Meeting Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sprint Sync / Architecture Review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-900 focus:border-neutral-400 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          {/* Date & Times */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="font-medium text-neutral-600 dark:text-neutral-400">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8.5 w-full rounded-lg border border-neutral-200 bg-white px-2 text-xs focus:border-neutral-400 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-neutral-600 dark:text-neutral-400">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-8.5 w-full rounded-lg border border-neutral-200 bg-white px-2 text-xs focus:border-neutral-400 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-neutral-600 dark:text-neutral-400">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-8.5 w-full rounded-lg border border-neutral-200 bg-white px-2 text-xs focus:border-neutral-400 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800"
              />
            </div>
          </div>

          {/* Location Type Picker */}
          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300">
              Location Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocationType("room")}
                className={`flex items-center justify-center rounded-lg border p-2 text-xs font-medium transition-all ${
                  locationType === "room"
                    ? "shadow-2xs border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                    : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400"
                }`}
              >
                🏢 Physical Room
              </button>
              <button
                type="button"
                onClick={() => setLocationType("virtual")}
                className={`flex items-center justify-center rounded-lg border p-2 text-xs font-medium transition-all ${
                  locationType === "virtual"
                    ? "shadow-2xs border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                    : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400"
                }`}
              >
                📹 Virtual Video Call
              </button>
            </div>
          </div>

          {/* Room or Platform Selector */}
          {locationType === "room" ? (
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Choose Room (HCM Office)
              </label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-xs focus:border-neutral-400 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800"
              >
                {HCM_MEETING_ROOMS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.capacity} pax) — {r.location}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Virtual Platform
              </label>
              <select
                value={virtualPlatform}
                onChange={(e) => setVirtualPlatform(e.target.value)}
                className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-xs focus:border-neutral-400 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800"
              >
                <option value="Google Meet">Google Meet (Auto-generate link)</option>
                <option value="Zoom Meeting">Zoom Meeting</option>
                <option value="Microsoft Teams">Microsoft Teams</option>
              </select>
            </div>
          )}

          {/* Attendees */}
          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300">
              Invite Attendees
            </label>
            <input
              type="text"
              placeholder="e.g. alex@example.com, eva@example.com"
              value={attendeesInput}
              onChange={(e) => setAttendeesInput(e.target.value)}
              className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-xs focus:border-neutral-400 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800"
            />
            <p className="text-[10px] text-neutral-400">Separate multiple emails with commas.</p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300">
              Agenda & Notes
            </label>
            <textarea
              rows={2}
              placeholder="Add meeting agenda or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-xs focus:border-neutral-400 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
            >
              Book Meeting
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
