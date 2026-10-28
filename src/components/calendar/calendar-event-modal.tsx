"use client";

import * as React from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Loader2,
  ShieldCheck,
  FolderGit2,
  ArrowRight,
} from "lucide-react";
import type { CalendarEvent } from "@/components/reui/event-calendar/event-calendar-types";
import type { CustomEventData } from "@/mock-data/calendar-events";
import { HtmlDescriptionViewer } from "@/components/ui/html-description-viewer";
import { apiClient } from "@/lib/api-client";
import { copyToClipboard } from "@/lib/clipboard";
import { toast } from "sonner";
import { CalendarEventLocationSection } from "./calendar-event-location-section";
import { CalendarEventAttendeesList } from "./calendar-event-attendees-list";

interface CalendarEventModalProps {
  event: CalendarEvent<CustomEventData> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteEvent: (id: string) => void;
}

export function CalendarEventModal({
  event,
  open,
  onOpenChange,
  onDeleteEvent,
}: CalendarEventModalProps) {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [attendeeFilter, setAttendeeFilter] = React.useState("");
  const [prevOpen, setPrevOpen] = React.useState(open);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      setAttendeeFilter("");
    }
  }

  const attendees = React.useMemo(() => event?.data?.attendees || [], [event?.data?.attendees]);

  const filteredAttendees = React.useMemo(() => {
    if (!attendeeFilter.trim()) return attendees;
    const q = attendeeFilter.toLowerCase();
    return attendees.filter(
      (a) =>
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q))
    );
  }, [attendees, attendeeFilter]);

  if (!event) return null;

  const now = new Date();
  const isLive = now >= event.start && now <= event.end;
  const isPast = now > event.end;

  const durationMinutes = Math.max(
    1,
    Math.round((event.end.getTime() - event.start.getTime()) / 60000)
  );
  const durationLabel =
    durationMinutes >= 60
      ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 ? ` ${durationMinutes % 60}m` : ""}`
      : `${durationMinutes}m`;

  const category = event.data?.category || "all";
  const meetingUrl = event.data?.meetingUrl;
  const roomDetails = event.data?.roomDetails;
  const location = event.data?.location;
  const description = event.data?.description;
  const organizer = event.data?.organizer;

  const handleCopyLink = async () => {
    if (!meetingUrl) return;
    const ok = await copyToClipboard(meetingUrl);
    if (ok) {
      setCopied(true);
      toast.success("Meeting link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy meeting link");
    }
  };

  const handleJoinCall = () => {
    if (meetingUrl) {
      window.open(meetingUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.bookings.cancel(event.id);
      toast.success("Meeting cancelled successfully");
      onDeleteEvent(event.id);
      onOpenChange(false);
    } catch {
      // If it fails on DB (e.g. gcal-only or mock event), still remove from UI
      onDeleteEvent(event.id);
      toast.info("Event removed from calendar view");
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background text-foreground max-h-[88vh] max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-2xl">
        <DialogHeader className="pb-1">
          {/* Status and Category badges */}
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                Live Now
              </span>
            ) : isPast ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-950/60 dark:text-orange-300">
                Confirmed
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: event.color || "#ea580c" }}
              />
              <span className="capitalize">{category}</span>
            </span>

            {event.data?.project ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                style={{
                  borderColor: event.data.project.color
                    ? `${event.data.project.color}50`
                    : "#2563eb50",
                  backgroundColor: event.data.project.color
                    ? `${event.data.project.color}15`
                    : "#2563eb15",
                  color: event.data.project.color || "#2563eb",
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: event.data.project.color || "#2563eb" }}
                />
                <span className="max-w-[120px] truncate">{event.data.project.name}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                Personal Event
              </span>
            )}

            {event.data?.source === "google" && (
              <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-400">
                Google Calendar
              </span>
            )}
          </div>

          <DialogTitle className="mt-2 break-words text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1 text-xs">
          {/* Time & Date Card */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200/80 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-800/40">
            <div className="flex items-center gap-2 font-semibold text-neutral-800 dark:text-neutral-200">
              <CalendarIcon className="size-4 shrink-0 text-neutral-400" />
              <span>{format(event.start, "EEEE, MMMM d, yyyy")}</span>
            </div>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
              <Clock className="size-4 shrink-0 text-neutral-400" />
              <span>
                {format(event.start, "h:mm a")} – {format(event.end, "h:mm a")} ({durationLabel})
              </span>
            </div>
          </div>

          {/* Linked Project & Task Navigation */}
          {event.data?.project && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200/80 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-800/40">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: event.data.project.color || "#2563eb" }}
                >
                  <FolderGit2 className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                    Linked Project
                  </p>
                  <p className="truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    {event.data.project.name}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const teamSlug = event.data?.project?.teamSlug || "all";
                  const projectSlug = event.data?.project?.slug;
                  if (projectSlug) {
                    router.push(`/tasks/${teamSlug}/${projectSlug}`);
                    onOpenChange(false);
                  }
                }}
                className="h-8 cursor-pointer gap-1.5 text-xs font-medium"
              >
                <span>View Tasks</span>
                <ArrowRight className="size-3" />
              </Button>
            </div>
          )}

          {/* Video Conference / Google Meet Section */}
          {meetingUrl && (
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 dark:border-orange-900/40 dark:bg-orange-950/20">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                    <Video className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      Google Meet
                    </p>
                    <p className="truncate text-[11px] text-neutral-500" title={meetingUrl}>
                      {meetingUrl}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-8 cursor-pointer gap-1 text-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="size-3 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleJoinCall}
                    className="h-8 cursor-pointer gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
                  >
                    <ExternalLink className="size-3.5" />
                    Join Call
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Location & Room Details */}
          <CalendarEventLocationSection roomDetails={roomDetails} location={location} />

          {/* Organizer */}
          {organizer && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Organizer
              </label>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200/80 bg-neutral-50/40 p-2.5 dark:border-neutral-800 dark:bg-neutral-800/40">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <Avatar className="size-7 shrink-0 text-[10px]">
                    {organizer.avatar && (
                      <AvatarImage src={organizer.avatar} alt={organizer.name} />
                    )}
                    <AvatarFallback className="bg-orange-500 text-[10px] font-bold text-white">
                      {(organizer.name || organizer.email || "H")
                        .split(" ")
                        .map((s) => s[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium leading-tight text-neutral-900 dark:text-neutral-100">
                      {organizer.name || organizer.email}
                    </p>
                    {organizer.email &&
                      organizer.name &&
                      organizer.email.toLowerCase() !== organizer.name.toLowerCase() && (
                        <p className="mt-0.5 truncate text-[10px] leading-tight text-neutral-500 dark:text-neutral-400">
                          {organizer.email}
                        </p>
                      )}
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0 gap-1 text-[10px] font-medium">
                  <ShieldCheck className="size-3 text-orange-600" /> Host
                </Badge>
              </div>
            </div>
          )}

          {/* Attendees List */}
          <CalendarEventAttendeesList
            attendees={attendees}
            organizer={organizer}
            attendeeFilter={attendeeFilter}
            onFilterChange={setAttendeeFilter}
            filteredAttendees={filteredAttendees}
          />

          {/* Description / Agenda */}
          {description && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Agenda / Notes
              </label>
              <div className="max-h-40 overflow-y-auto break-words rounded-lg border border-neutral-200/80 bg-neutral-50/40 p-3 dark:border-neutral-800 dark:bg-neutral-800/40">
                <HtmlDescriptionViewer html={description} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 sm:justify-between dark:border-neutral-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            onClick={handleDelete}
            className="h-8 cursor-pointer gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <Trash2 className="size-3.5" />
                Cancel Meeting
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            {meetingUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="h-8 cursor-pointer gap-1.5 text-xs"
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                Copy Link
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 cursor-pointer bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
