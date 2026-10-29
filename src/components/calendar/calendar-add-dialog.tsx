"use client";

import * as React from "react";
import { format, addMinutes, parseISO, isValid } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Clock, Video, Building2, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
    format(selectedDate, "yyyy-MM-dd"),
  );
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("09:30");
  const [duration, setDuration] = React.useState(30);

  const [locationType, setLocationType] = React.useState<"virtual" | "room">(
    "virtual",
  );
  const [selectedRoomId, setSelectedRoomId] = React.useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = React.useState<
    string | null
  >(null);
  const [selectedProject, setSelectedProject] =
    React.useState<ProjectOption | null>(null);
  const [selectedAttendees, setSelectedAttendees] = React.useState<
    SelectedAttendee[]
  >([]);
  const [autoAddedEmails, setAutoAddedEmails] = React.useState<string[]>([]);
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const [prevOpen, setPrevOpen] = React.useState(open);
  if (!prevOpen && open) {
    setPrevOpen(true);
    setDateStr(format(selectedDate, "yyyy-MM-dd"));
    const defaults = getDefaultTimes();
    setStartTime(initialStartTime || defaults.start);
    setEndTime(initialEndTime || defaults.end);
    setSelectedProjectId(null);
    setSelectedProject(null);
    setSelectedAttendees([]);
    setAutoAddedEmails([]);
  } else if (prevOpen && !open) {
    setPrevOpen(false);
  }

  React.useEffect(() => {
    if (!open) return;
    let active = true;

    apiClient.eventTypes
      .list()
      .then((data) => {
        if (active) setEventTypes(data);
      })
      .catch(() => {});

    apiClient.rooms
      .list()
      .then((res) => {
        if (active) {
          setRooms(res);
          if (res.length > 0) {
            const sorted = [...res].sort((a, b) => {
              const locA = (a.officeLocation || "hcm").toUpperCase();
              const locB = (b.officeLocation || "hcm").toUpperCase();
              if (locA !== locB) return locA.localeCompare(locB);
              return a.name.localeCompare(b.name);
            });
            if (!selectedRoomId || !res.some((r) => r.id === selectedRoomId)) {
              setSelectedRoomId(sorted[0].id);
            }
          }
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [open, selectedRoomId]);

  const groupedRooms = React.useMemo(() => {
    const map = new Map<string, MeetingRoom[]>();
    const sorted = [...rooms].sort((a, b) => {
      const locA = (a.officeLocation || "hcm").toUpperCase();
      const locB = (b.officeLocation || "hcm").toUpperCase();
      if (locA !== locB) {
        return locA.localeCompare(locB);
      }
      return a.name.localeCompare(b.name);
    });

    for (const room of sorted) {
      const loc = (room.officeLocation || "hcm").toUpperCase();
      if (!map.has(loc)) {
        map.set(loc, []);
      }
      map.get(loc)!.push(room);
    }

    return map;
  }, [rooms]);

  const durationMinutes = React.useMemo(
    () => computeDurationMinutes(startTime, endTime),
    [startTime, endTime],
  );

  const dateObj = React.useMemo(() => {
    if (!dateStr) return new Date();
    const parsed = parseISO(dateStr);
    return isValid(parsed) ? parsed : new Date();
  }, [dateStr]);

  const handleSelectTemplate = (et: EventType | null) => {
    setSelectedEventType(et);
    if (!et) return;

    setDuration(et.duration);
    if (!title || eventTypes.some((t) => t.name === title)) {
      setTitle(et.name);
    }
    if (et.description && !description) {
      setDescription(et.description);
    }
    if (et.requiresRoom && rooms.length > 0) {
      setLocationType("room");
    }

    const [h, m] = startTime.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      setEndTime(
        format(addMinutes(new Date(2000, 0, 1, h, m), et.duration), "HH:mm"),
      );
    }
  };

  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    const [h, m] = newStartTime.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      setEndTime(
        format(addMinutes(new Date(2000, 0, 1, h, m), duration), "HH:mm"),
      );
    }
  };

  const handleSetDuration = (mins: number) => {
    setDuration(mins);
    const [h, m] = startTime.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      setEndTime(format(addMinutes(new Date(2000, 0, 1, h, m), mins), "HH:mm"));
    }
  };

  const handleProjectChange = async (
    projectId: string | null,
    project?: ProjectOption | null,
  ) => {
    setSelectedProjectId(projectId);
    setSelectedProject(project || null);

    const prevAutoAddedSet = new Set(
      autoAddedEmails.map((e) => e.toLowerCase()),
    );

    if (!projectId || !project?.teamId) {
      if (prevAutoAddedSet.size > 0) {
        setSelectedAttendees((prev) =>
          prev.filter((a) => !prevAutoAddedSet.has(a.email.toLowerCase())),
        );
        setAutoAddedEmails([]);
      }
      return;
    }

    try {
      const res = await fetch(`/api/teams/${project.teamId}/members`);
      if (!res.ok) return;
      const data = await res.json();
      const members: Array<{
        user?: {
          id: string;
          name: string;
          email: string;
          image?: string | null;
        } | null;
        name?: string;
        email?: string;
      }> = Array.isArray(data) ? data : data.data || [];

      const newlyAdded: string[] = [];
      const userEmail = session?.user?.email?.toLowerCase();

      setSelectedAttendees((prev) => {
        const baseAttendees =
          prevAutoAddedSet.size > 0
            ? prev.filter((a) => !prevAutoAddedSet.has(a.email.toLowerCase()))
            : prev;

        const existingEmails = new Set(
          baseAttendees.map((a) => a.email.toLowerCase()),
        );
        const toAdd: SelectedAttendee[] = [];

        for (const m of members) {
          const email = m.user?.email || m.email;
          if (!email) continue;
          const lower = email.toLowerCase();
          // Exclude the current organizer from being auto-added as an invitee
          if (userEmail && lower === userEmail) continue;

          if (!existingEmails.has(lower)) {
            toAdd.push({
              name: m.user?.name || m.name || email.split("@")[0],
              email,
              avatarUrl: m.user?.image || undefined,
            });
            existingEmails.add(lower);
            newlyAdded.push(lower);
          }
        }

        if (toAdd.length > 0) {
          toast.info(
            `Added ${toAdd.length} team member${toAdd.length > 1 ? "s" : ""} as invitees`,
          );
        }
        return [...baseAttendees, ...toAdd];
      });

      setAutoAddedEmails(newlyAdded);
    } catch (err) {
      console.warn("Failed to fetch team members for project:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const startIso = new Date(`${dateStr}T${startTime}:00`).toISOString();
      const endIso = new Date(`${dateStr}T${endTime}:00`).toISOString();

      if (new Date(startIso) >= new Date(endIso)) {
        toast.error("End time must be after start time");
        setIsSubmitting(false);
        return;
      }

      const attendees = selectedAttendees.map((a) => a.email);

      const teamTag = selectedProject?.teamName?.trim();
      let cleanTitle = title.trim();
      if (teamTag) {
        if (cleanTitle.startsWith(`[${teamTag}]`)) {
          cleanTitle = cleanTitle.slice(`[${teamTag}]`.length).trimStart();
        }
      }
      const finalTitle = teamTag ? `[${teamTag}] ${cleanTitle}` : cleanTitle;

      const booking = await apiClient.bookings.create({
        title: finalTitle,
        description: description.trim() || undefined,
        eventTypeId: selectedEventType?.id,
        roomId: locationType === "room" ? selectedRoomId : undefined,
        projectId: selectedProjectId || undefined,
        startTime: startIso,
        endTime: endIso,
        attendees: attendees.length > 0 ? attendees : undefined,
        organizerUserId: session?.user?.id || "usr_alex_rivera",
      });

      toast.success("Event scheduled successfully!");
      onCreated?.();

      if (onAddEvent) {
        onAddEvent({
          id: booking.id,
          title: booking.title,
          start: new Date(booking.startTime),
          end: new Date(booking.endTime),
          color: "#0284c7",
          data: {
            category: "shared",
            location:
              locationType === "room"
                ? rooms.find((r) => r.id === selectedRoomId)?.name
                : "Google Meet",
            description: booking.description ?? undefined,
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

      setTitle("");
      setDescription("");
      setSelectedAttendees([]);
      setSelectedProjectId(null);
      setSelectedProject(null);
      setSelectedEventType(null);
      setAutoAddedEmails([]);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create event",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule New Event</DialogTitle>
          <DialogDescription>
            Book a room or create a virtual meeting conference.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Event Template Dropdown */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Event Template</Label>
            <Select
              value={selectedEventType?.id ?? "custom"}
              onValueChange={(val) => {
                if (!val || val === "custom") {
                  handleSelectTemplate(null);
                } else {
                  const found = eventTypes.find((et) => et.id === val);
                  handleSelectTemplate(found || null);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a template...">
                  {selectedEventType
                    ? `${selectedEventType.name} (${selectedEventType.duration}m)`
                    : "Custom Event"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Event</SelectItem>
                {eventTypes.map((et) => (
                  <SelectItem key={et.id} value={et.id}>
                    {et.name} ({et.duration}m)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Title</Label>
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
                placeholder={
                  selectedProject?.teamName
                    ? "Meeting topic (e.g. Sprint Planning)"
                    : "e.g. Architecture Review"
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
                className="text-xs"
              />
            </InputGroup>
          </div>

          {/* Date & Time Fields */}
          <div className="space-y-3">
            {/* Date Field with Shadcn Calendar Popover */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Date</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-9 w-full justify-start px-3 text-left text-xs font-normal",
                        !dateStr && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 size-3.5 shrink-0" />
                      {dateObj ? format(dateObj, "PPP") : "Pick a date"}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateObj}
                    onSelect={(date) => {
                      if (date) {
                        setDateStr(format(date, "yyyy-MM-dd"));
                        setIsCalendarOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Start Time & End Time */}
            <div className="grid grid-cols-2 gap-3">
              {/* Start Time */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              {/* End Time */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">End Time</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Duration Shortcuts */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-normal">
                <Clock className="size-3.5" />
                <span>Duration:</span>
                <strong className="text-foreground font-semibold">
                  {durationMinutes >= 60
                    ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60 ? `${durationMinutes % 60}m` : ""}`
                    : `${durationMinutes} mins`}
                </strong>
              </span>

              <div className="flex items-center gap-1">
                {[15, 30, 45, 60, 90].map((mins) => (
                  <Button
                    key={mins}
                    type="button"
                    variant={durationMinutes === mins ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSetDuration(mins)}
                    className="h-7 px-2 text-[11px]"
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Location Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Location</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={locationType === "virtual" ? "default" : "outline"}
                size="sm"
                onClick={() => setLocationType("virtual")}
                className="h-9 gap-2 text-xs"
              >
                <Video className="size-3.5" />
                <span>Google Meet</span>
              </Button>

              <Button
                type="button"
                variant={locationType === "room" ? "default" : "outline"}
                size="sm"
                onClick={() => setLocationType("room")}
                className="h-9 gap-2 text-xs"
              >
                <Building2 className="size-3.5" />
                <span>Physical Room</span>
              </Button>
            </div>

            {locationType === "room" && (
              <div className="pt-1">
                <Select
                  value={selectedRoomId}
                  onValueChange={(val) => {
                    if (val) setSelectedRoomId(val);
                  }}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Select a room...">
                      {selectedRoom
                        ? `[${(selectedRoom.officeLocation || "hcm").toUpperCase()}] ${selectedRoom.name} (${selectedRoom.capacity} seats)`
                        : "Select a room..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(groupedRooms.entries()).map(
                      ([loc, roomList]) => (
                        <SelectGroup key={loc}>
                          <SelectLabel className="text-muted-foreground px-2 py-1 text-[11px] font-semibold uppercase tracking-wider">
                            {loc === "DN"
                              ? "Da Nang Office (DN)"
                              : loc === "HCM"
                                ? "Ho Chi Minh Office (HCM)"
                                : `${loc} Office`}
                          </SelectLabel>
                          {roomList.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              <div className="flex w-full items-center justify-between gap-2 text-xs">
                                <span className="font-medium">
                                  [{loc}] {r.name}
                                </span>
                                <span className="text-muted-foreground shrink-0 text-[11px]">
                                  {r.capacity} seats
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Project Selection */}
          <CalendarProjectPicker
            value={selectedProjectId}
            onChange={handleProjectChange}
            disabled={isSubmitting}
          />

          {/* Invite Attendees */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Invite Attendees</Label>
            <UserAutocompletePicker
              value={selectedAttendees}
              onChange={setSelectedAttendees}
              placeholder="Search colleagues or enter email..."
            />
          </div>

          {/* Agenda & Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Agenda & Notes</Label>
            <Textarea
              rows={3}
              placeholder="Add meeting agenda, context, or discussion topics..."
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
                  Scheduling...
                </>
              ) : (
                "Schedule Event"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
