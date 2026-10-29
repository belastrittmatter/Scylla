"use client";

import * as React from "react";
import { format, addMinutes, addDays, isValid } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import type { EventType, MeetingRoom } from "@/db/schema";
import type { CalendarEvent } from "@/components/reui/event-calendar/event-calendar-types";
import type { CustomEventData } from "@/mock-data/calendar-events";
import {
  UserAutocompletePicker,
  type SelectedAttendee,
} from "./user-autocomplete-picker";
import {
  CalendarProjectPicker,
  type ProjectOption,
} from "./calendar-project-picker";
import { CalendarDateTimeSection } from "./calendar-datetime-section";
import { CalendarLocationSection } from "./calendar-location-section";
import {
  CalendarRepeatOptions,
  type RepeatFrequency,
} from "./calendar-repeat-options";

interface CalendarAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  initialStartTime?: string;
  initialEndTime?: string;
  onAddEvent?: (event: CalendarEvent<CustomEventData>) => void;
  onCreated?: () => void;
}

function computeDurationMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 30;
  return Math.max(15, eh * 60 + em - (sh * 60 + sm));
}

function getDefaultTimes(): { start: string; end: string } {
  const now = new Date();
  const mins = now.getMinutes();
  now.setMinutes(mins < 30 ? 30 : 60, 0, 0);
  return {
    start: format(now, "HH:mm"),
    end: format(addMinutes(now, 30), "HH:mm"),
  };
}

function generateSeriesId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `series_${crypto.randomUUID()}`;
  }
  return `series_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
}

export function CalendarAddDialog({
  open,
  onOpenChange,
  selectedDate,
  initialStartTime,
  initialEndTime,
  onAddEvent,
  onCreated,
}: CalendarAddDialogProps) {
  const { data: session } = useSession();
  const [eventTypes, setEventTypes] = React.useState<EventType[]>([]);
  const [rooms, setRooms] = React.useState<MeetingRoom[]>([]);
  const [selectedEventType, setSelectedEventType] =
    React.useState<EventType | null>(null);

  const [title, setTitle] = React.useState("");
  const [dateStr, setDateStr] = React.useState(
    selectedDate && isValid(selectedDate)
      ? format(selectedDate, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
  );
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("09:30");
  const durationMinutes = computeDurationMinutes(startTime, endTime);

  const [locationType, setLocationType] = React.useState<"virtual" | "room">(
    "virtual",
  );
  const [selectedRoomId, setSelectedRoomId] = React.useState<string>("");
  const [repeatFrequency, setRepeatFrequency] =
    React.useState<RepeatFrequency>("none");
  const [selectedProjectId, setSelectedProjectId] = React.useState<
    string | null
  >(null);
  const [selectedProject, setSelectedProject] =
    React.useState<ProjectOption | null>(null);
  const [selectedAttendees, setSelectedAttendees] = React.useState<
    SelectedAttendee[]
  >([]);
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        const formattedDate =
          selectedDate && isValid(selectedDate)
            ? format(selectedDate, "yyyy-MM-dd")
            : format(new Date(), "yyyy-MM-dd");
        setDateStr(formattedDate);
        const defaults = getDefaultTimes();
        setStartTime(initialStartTime || defaults.start);
        setEndTime(initialEndTime || defaults.end);
        setRepeatFrequency("none");
        setSelectedProjectId(null);
        setSelectedProject(null);
        setSelectedAttendees([]);
        setTitle("");
        setDescription("");
        setSelectedEventType(null);
        setLocationType("virtual");
      });
    }
  }, [open, selectedDate, initialStartTime, initialEndTime]);

  React.useEffect(() => {
    if (!open) return;
    let active = true;

    apiClient.eventTypes
      .list()
      .then((data) => {
        if (active && Array.isArray(data)) setEventTypes(data);
      })
      .catch(() => {});

    apiClient.rooms
      .list()
      .then((res) => {
        if (active && Array.isArray(res)) {
          setRooms(res);
          if (res.length > 0) {
            setSelectedRoomId((prev) => (prev ? prev : res[0].id));
          }
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [open]);

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    const [h, m] = val.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const d = new Date();
      d.setHours(h, m, 0, 0);
      setEndTime(format(addMinutes(d, durationMinutes), "HH:mm"));
    }
  };

  const handleSetDuration = (mins: number) => {
    const [h, m] = startTime.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const d = new Date();
      d.setHours(h, m, 0, 0);
      setEndTime(format(addMinutes(d, mins), "HH:mm"));
    }
  };

  const handleSelectTemplate = (et: EventType | null) => {
    setSelectedEventType(et);
    if (et) {
      if (!title.trim() || title === "New Meeting") {
        setTitle(et.name);
      }
      handleSetDuration(et.duration);
    }
  };

  const handleProjectChange = async (
    projId: string | null,
    option?: ProjectOption | null,
  ) => {
    setSelectedProjectId(projId);
    setSelectedProject(option || null);
    if (!projId) return;

    try {
      let teamId = option?.teamId;
      if (!teamId) {
        const projectList = await apiClient.projects.list();
        const found = projectList.find((p) => p.id === projId);
        teamId = found?.teamId;
        if (found && !option) {
          setSelectedProject({
            id: found.id,
            name: found.name,
            slug: found.slug,
            color: found.color,
            teamId: found.teamId,
            teamName: found.teamName,
          });
        }
      }

      if (!teamId) return;

      const members = await apiClient.teams.members(teamId);
      if (Array.isArray(members)) {
        const currentUserId = session?.user?.id;
        const currentUserEmail = session?.user?.email?.toLowerCase();

        const teamAttendees: SelectedAttendee[] = members
          .filter((m) => {
            if (!m || !m.user || !m.user.email) return false;
            const mEmail = m.user.email.toLowerCase();
            // Exclude host / organizer from attendees list
            if (currentUserEmail && mEmail === currentUserEmail) return false;
            if (
              currentUserId &&
              (m.userId === currentUserId || m.user.id === currentUserId)
            )
              return false;
            return true;
          })
          .map((m) => ({
            id: m.userId,
            name: m.user.name || m.user.email.split("@")[0],
            email: m.user.email,
            avatarUrl: m.user.image || undefined,
          }));

        setSelectedAttendees((prev) => {
          // Exclude host if previously present
          const filteredPrev = prev.filter((a) => {
            const aEmail = a.email.toLowerCase();
            if (currentUserEmail && aEmail === currentUserEmail) return false;
            if (currentUserId && a.id === currentUserId) return false;
            return true;
          });
          const existingEmails = new Set(
            filteredPrev.map((a) => a.email.toLowerCase()),
          );
          const toAdd = teamAttendees.filter(
            (a) => !existingEmails.has(a.email.toLowerCase()),
          );
          return [...filteredPrev, ...toAdd];
        });
      }
    } catch (err) {
      console.warn("Failed to fetch team members for project:", err);
    }
  };

  const calculateDatesToSchedule = (
    baseStart: Date,
    baseEnd: Date,
  ): { start: string; end: string }[] => {
    const dates: { start: string; end: string }[] = [];
    if (repeatFrequency === "none") {
      dates.push({
        start: baseStart.toISOString(),
        end: baseEnd.toISOString(),
      });
    } else if (repeatFrequency === "daily_workdays") {
      let curr = new Date(baseStart);
      let currEnd = new Date(baseEnd);
      let count = 0;
      while (count < 5) {
        const day = curr.getDay();
        if (day !== 0 && day !== 6) {
          dates.push({ start: curr.toISOString(), end: currEnd.toISOString() });
          count++;
        }
        curr = addDays(curr, 1);
        currEnd = addDays(currEnd, 1);
      }
    } else if (repeatFrequency === "daily_all") {
      for (let i = 0; i < 7; i++) {
        dates.push({
          start: addDays(baseStart, i).toISOString(),
          end: addDays(baseEnd, i).toISOString(),
        });
      }
    } else if (repeatFrequency === "weekly") {
      for (let i = 0; i < 4; i++) {
        dates.push({
          start: addDays(baseStart, i * 7).toISOString(),
          end: addDays(baseEnd, i * 7).toISOString(),
        });
      }
    }
    return dates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const baseStartDate = new Date(`${dateStr}T${startTime}:00`);
      const baseEndDate = new Date(`${dateStr}T${endTime}:00`);

      if (isNaN(baseStartDate.getTime()) || isNaN(baseEndDate.getTime())) {
        toast.error("Please enter a valid date and time");
        setIsSubmitting(false);
        return;
      }

      if (baseStartDate >= baseEndDate) {
        toast.error("End time must be after start time");
        setIsSubmitting(false);
        return;
      }

      const attendees = selectedAttendees.map((a) => a.email);
      const teamTag = selectedProject?.teamName?.trim();
      let cleanTitle = title.trim();
      if (teamTag && cleanTitle.startsWith(`[${teamTag}]`)) {
        cleanTitle = cleanTitle.slice(`[${teamTag}]`.length).trimStart();
      }
      const finalTitle = teamTag ? `[${teamTag}] ${cleanTitle}` : cleanTitle;

      const datesToSchedule = calculateDatesToSchedule(
        baseStartDate,
        baseEndDate,
      );
      const isRecurring = datesToSchedule.length > 1;
      const seriesId = isRecurring ? generateSeriesId() : undefined;

      const roomToAssign =
        locationType === "room" && selectedRoomId.trim()
          ? selectedRoomId.trim()
          : undefined;

      const createdBookings: { id: string }[] = [];
      const createdEvents: CalendarEvent<CustomEventData>[] = [];

      try {
        for (const slot of datesToSchedule) {
          const seriesTag = seriesId ? `<!--series:${seriesId}-->` : "";
          const descText = description.trim();
          const finalDescription = seriesTag
            ? descText
              ? `${descText}\n\n${seriesTag}`
              : seriesTag
            : descText || undefined;

          const booking = await apiClient.bookings.create({
            title: finalTitle,
            description: finalDescription,
            eventTypeId: selectedEventType?.id,
            roomId: roomToAssign,
            projectId: selectedProjectId || undefined,
            startTime: slot.start,
            endTime: slot.end,
            attendees: attendees.length > 0 ? attendees : undefined,
            organizerUserId: session?.user?.id || "usr_alex_rivera",
          });

          createdBookings.push(booking);

          createdEvents.push({
            id: booking.id,
            title: booking.title,
            start: new Date(booking.startTime),
            end: new Date(booking.endTime),
            color: "#0284c7",
            recurringEventId: seriesId,
            data: {
              category: "shared",
              location:
                locationType === "room" && roomToAssign
                  ? rooms.find((r) => r.id === roomToAssign)?.name ||
                    "Meeting Room"
                  : "Google Meet",
              description: booking.description ?? undefined,
              seriesId,
              meetingUrl: booking.meetingUrl ?? undefined,
              projectId: booking.projectId || undefined,
              attendees: selectedAttendees.map((a) => ({
                name: a.name,
                email: a.email,
                avatar: a.avatarUrl,
              })),
            },
          });
        }
      } catch (loopErr) {
        // Rollback already created bookings if any subsequent slot fails
        if (createdBookings.length > 0) {
          await Promise.allSettled(
            createdBookings.map((b) =>
              apiClient.bookings.cancel(b.id, { singleOnly: true }),
            ),
          );
        }
        throw loopErr;
      }

      if (onAddEvent) {
        for (const ev of createdEvents) {
          onAddEvent(ev);
        }
      }

      if (datesToSchedule.length > 1) {
        toast.success(
          `Scheduled ${datesToSchedule.length} recurring sessions!`,
        );
      } else {
        toast.success("Event scheduled successfully!");
      }

      onCreated?.();
      setTitle("");
      setDescription("");
      setSelectedAttendees([]);
      setSelectedProjectId(null);
      setSelectedProject(null);
      setSelectedEventType(null);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create event",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-md">
        <DialogHeader className="pb-0.5">
          <DialogTitle className="text-base font-semibold">
            New Event
          </DialogTitle>
          <DialogDescription className="sr-only">
            Create a calendar event
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* Title with Team Prefix */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Title
            </Label>
            <InputGroup className="h-9">
              {selectedProject?.teamName && (
                <InputGroupAddon
                  align="inline-start"
                  className="text-primary pr-1 text-xs font-semibold"
                >
                  [{selectedProject.teamName}]
                </InputGroupAddon>
              )}
              <InputGroupInput
                placeholder="Event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
                className="text-xs"
              />
            </InputGroup>
          </div>

          {/* Template & Project Picker Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                Template
              </Label>
              <Select
                value={selectedEventType?.id ?? "custom"}
                onValueChange={(val) => {
                  if (!val || val === "custom") handleSelectTemplate(null);
                  else
                    handleSelectTemplate(
                      eventTypes.find((et) => et.id === val) || null,
                    );
                }}
              >
                <SelectTrigger className="h-8.5 w-full text-xs">
                  <SelectValue placeholder="Custom">
                    {selectedEventType
                      ? `${selectedEventType.name} (${selectedEventType.duration}m)`
                      : "Custom"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  {eventTypes.map((et) => (
                    <SelectItem key={et.id} value={et.id}>
                      {et.name} ({et.duration}m)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                Project
              </Label>
              <CalendarProjectPicker
                value={selectedProjectId}
                onChange={handleProjectChange}
                disabled={isSubmitting}
                hideLabel
              />
            </div>
          </div>

          {/* Date & Time Clean Card */}
          <CalendarDateTimeSection
            dateStr={dateStr}
            onDateChange={setDateStr}
            startTime={startTime}
            onStartTimeChange={handleStartTimeChange}
            endTime={endTime}
            onEndTimeChange={setEndTime}
            durationMinutes={durationMinutes}
            onSetDuration={handleSetDuration}
          />

          {/* Repeat Options */}
          <CalendarRepeatOptions
            frequency={repeatFrequency}
            onChange={setRepeatFrequency}
            disabled={isSubmitting}
          />

          {/* Location & Room */}
          <CalendarLocationSection
            locationType={locationType}
            onLocationTypeChange={setLocationType}
            selectedRoomId={selectedRoomId}
            onRoomChange={setSelectedRoomId}
            rooms={rooms}
            disabled={isSubmitting}
          />

          {/* Invite Colleagues */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Attendees
            </Label>
            <UserAutocompletePicker
              value={selectedAttendees}
              onChange={setSelectedAttendees}
              placeholder="Add attendees..."
            />
          </div>

          {/* Agenda / Notes */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Notes
            </Label>
            <Textarea
              rows={2}
              placeholder="Add notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
