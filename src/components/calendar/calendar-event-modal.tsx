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
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Loader2,
  FolderGit2,
  ArrowRight,
  Repeat,
} from "lucide-react";
import type { CalendarEvent } from "@/components/reui/event-calendar/event-calendar-types";
import type { CustomEventData } from "@/mock-data/calendar-events";
import { HtmlDescriptionViewer } from "@/components/ui/html-description-viewer";
import { apiClient } from "@/lib/api-client";
import { copyToClipboard } from "@/lib/clipboard";
import { formatPersonName } from "@/lib/format-person-name";
import { toast } from "sonner";
import { CalendarEventLocationSection } from "./calendar-event-location-section";
import { CalendarEventAttendeesList } from "./calendar-event-attendees-list";
import { CalendarCancelPrompt } from "./calendar-cancel-prompt";

type Attendee = NonNullable<CustomEventData["attendees"]>[number];

function isRoomAttendee(attendee: Attendee, roomName?: string): boolean {
  const email = attendee.email.toLowerCase();
  if (
    email.includes("resource.calendar.google.com") ||
    email.includes("meetingroom")
  ) {
    return true;
  }
  return Boolean(
    roomName && attendee.name?.toLowerCase() === roomName.toLowerCase(),
  );
}

interface CalendarEventModalProps {
  event: CalendarEvent<CustomEventData> | null;
  allEvents?: CalendarEvent<CustomEventData>[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteEvent: (id: string) => void;
  onDeleteSeries?: (
    seriesId: string,
    eventId: string,
    eventTitle?: string,
  ) => void;
}

export function CalendarEventModal({
  event,
  allEvents,
  open,
  onOpenChange,
  onDeleteEvent,
  onDeleteSeries,
}: CalendarEventModalProps) {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [cancelTarget, setCancelTarget] = React.useState<
    "single" | "series" | null
  >(null);
  const [showCancelPrompt, setShowCancelPrompt] = React.useState(false);
  const [attendeeFilter, setAttendeeFilter] = React.useState("");
  const [prevOpen, setPrevOpen] = React.useState(open);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      setAttendeeFilter("");
      setCancelTarget(null);
      setShowCancelPrompt(false);
    }
  }

  const attendees = React.useMemo(
    () => event?.data?.attendees || [],
    [event?.data?.attendees],
  );
  const organizer = event?.data?.organizer;
  const roomDetails = event?.data?.roomDetails;

  const peopleAttendees = React.useMemo(
    () =>
      attendees.filter(
        (attendee) => !isRoomAttendee(attendee, roomDetails?.name),
      ),
    [attendees, roomDetails?.name],
  );
  const roomEmail = attendees.find((attendee) =>
    isRoomAttendee(attendee, roomDetails?.name),
  )?.email;

  // Keep the organizer visible with a single quiet HOST label.
  const people = React.useMemo(() => {
    const organizerEmail = organizer?.email?.toLowerCase();
    if (
      !organizer?.email ||
      !organizerEmail ||
      peopleAttendees.some(
        (attendee) => attendee.email.toLowerCase() === organizerEmail,
      )
    ) {
      return peopleAttendees;
    }
    return [
      {
        name: organizer.name,
        email: organizer.email,
        avatar: organizer.avatar,
      },
      ...peopleAttendees,
    ];
  }, [peopleAttendees, organizer]);

  const filteredAttendees = React.useMemo(() => {
    if (!attendeeFilter.trim()) return people;
    const q = attendeeFilter.toLowerCase();
    return people.filter(
      (a) =>
        (a.name &&
          formatPersonName(a.name, a.email).toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q)),
    );
  }, [people, attendeeFilter]);

  const rawDescription = event?.data?.description || "";
  const seriesId =
    event?.recurringEventId ||
    event?.data?.seriesId ||
    rawDescription.match(/<!--series:([a-zA-Z0-9_-]+)-->/)?.[1] ||
    null;

  const siblingCount = React.useMemo(() => {
    if (!allEvents || !event) return 0;
    const eventStart = new Date(event.start).getTime();
    const eventEnd = new Date(event.end).getTime();
    const eventDuration = eventEnd - eventStart;
    return allEvents.filter((e) => {
      if (e.id === event.id) return false;
      if (
        seriesId &&
        (e.recurringEventId === seriesId || e.data?.seriesId === seriesId)
      ) {
        return true;
      }
      if (
        seriesId &&
        e.data?.description?.includes(`<!--series:${seriesId}-->`)
      ) {
        return true;
      }
      const eStart = new Date(e.start).getTime();
      const eEnd = new Date(e.end).getTime();
      const d = eEnd - eStart;
      const sameDuration = Math.abs(d - eventDuration) < 60000;
      const sameTitle =
        (e.title || "").trim().toLowerCase() ===
        (event.title || "").trim().toLowerCase();
      return sameTitle && sameDuration;
    }).length;
  }, [allEvents, event, seriesId]);

  if (!event) return null;

  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  const now = new Date();
  const isLive = now >= startDate && now <= endDate;
  const isPast = now > endDate;

  const durationMinutes = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / 60000),
  );
  const durationLabel =
    durationMinutes >= 60
      ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 ? ` ${durationMinutes % 60}m` : ""}`
      : `${durationMinutes}m`;

  const category = event.data?.category || "all";
  const meetingUrl = event.data?.meetingUrl;
  const location = event.data?.location;
  const isRecurring = Boolean(seriesId) || siblingCount > 0;
  const description = rawDescription
    .replace(/<!--series:[a-zA-Z0-9_-]+-->/g, "")
    .trim();

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

  const handleDeleteSingle = async () => {
    setIsDeleting(true);
    setCancelTarget("single");
    try {
      await apiClient.bookings.cancel(event.id, { singleOnly: true });
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
      setCancelTarget(null);
    }
  };

  const handleDeleteSeries = async () => {
    setIsDeleting(true);
    setCancelTarget("series");
    try {
      await apiClient.bookings.cancelSeries(event.id);
      toast.success("All recurring meetings cancelled");
      if (onDeleteSeries) {
        onDeleteSeries(seriesId || "", event.id, event.title);
      } else {
        onDeleteEvent(event.id);
      }
      onOpenChange(false);
    } catch {
      if (onDeleteSeries) {
        onDeleteSeries(seriesId || "", event.id, event.title);
      } else {
        onDeleteEvent(event.id);
      }
      toast.info("Recurring events removed from calendar view");
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
      setCancelTarget(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto rounded-2xl border bg-card p-6 text-card-foreground shadow-2xl">
        <DialogHeader className="pb-1">
          <div>
            {isLive ? (
              <span className="inline-flex h-[22px] items-center gap-1.5 rounded-full bg-primary px-2.5 text-[11px] font-semibold text-primary-foreground">
                <span
                  aria-hidden
                  className="size-1.5 animate-pulse rounded-full bg-primary-foreground motion-reduce:animate-none"
                />
                Live now
              </span>
            ) : isPast ? (
              <span className="inline-flex h-[22px] items-center rounded-full bg-muted px-2.5 text-[11px] font-semibold text-muted-foreground">
                Completed
              </span>
            ) : (
              <span className="inline-flex h-[22px] items-center rounded-full bg-primary px-2.5 text-[11px] font-semibold text-primary-foreground">
                Confirmed
              </span>
            )}
          </div>

          <DialogTitle className="mt-2 break-words text-xl font-bold tracking-tight text-foreground">
            {event.title}
          </DialogTitle>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="max-w-[200px] truncate">
              {event.data?.project?.name ?? "Personal event"}
            </span>
            <span aria-hidden>·</span>
            <span className="capitalize">{category}</span>
            {isRecurring && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Repeat aria-hidden className="size-3" />
                  Recurring
                </span>
              </>
            )}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-1 text-xs">
          {/* Time & Date Card */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
              <span>{format(event.start, "EEEE, MMMM d, yyyy")}</span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-4 shrink-0 text-muted-foreground" />
              <span>
                {format(event.start, "h:mm a")} – {format(event.end, "h:mm a")}{" "}
                ({durationLabel})
              </span>
            </div>
          </div>

          {/* Linked Project & Task Navigation */}
          {event.data?.project && (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{
                    backgroundColor: event.data.project.color || "#2563eb",
                  }}
                >
                  <FolderGit2 className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Linked project
                  </p>
                  <p className="truncate text-xs font-semibold text-foreground">
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
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Video className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">
                      Google Meet
                    </p>
                    <p
                      className="truncate text-[11px] text-muted-foreground"
                      title={meetingUrl}
                    >
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
                        <Check className="size-3 text-foreground" />
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
                    className="h-8 cursor-pointer gap-1.5"
                  >
                    <ExternalLink className="size-3.5" />
                    Join Call
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Location & Room Details */}
          <CalendarEventLocationSection
            roomDetails={roomDetails}
            roomEmail={roomEmail}
            location={location}
          />

          {/* Attendees List */}
          <CalendarEventAttendeesList
            attendees={people}
            organizer={organizer}
            attendeeFilter={attendeeFilter}
            onFilterChange={setAttendeeFilter}
            filteredAttendees={filteredAttendees}
          />

          {/* Description / Agenda */}
          {description && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Agenda / Notes
              </label>
              <div className="max-h-40 overflow-y-auto break-words rounded-lg border bg-muted/40 p-3">
                <HtmlDescriptionViewer html={description} />
              </div>
            </div>
          )}
        </div>

        {showCancelPrompt && isRecurring ? (
          <div className="mt-4 border-t pt-3">
            <CalendarCancelPrompt
              isDeleting={isDeleting}
              cancelTarget={cancelTarget}
              onCancelSingle={handleDeleteSingle}
              onCancelSeries={handleDeleteSeries}
              onDismiss={() => setShowCancelPrompt(false)}
            />
          </div>
        ) : (
          <DialogFooter className="mt-4 flex items-center justify-between border-t pt-3 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={() => {
                if (isRecurring) {
                  setShowCancelPrompt(true);
                } else {
                  handleDeleteSingle();
                }
              }}
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
                    <Check className="size-3.5 text-foreground" />
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
                variant="secondary"
                className="h-8 cursor-pointer"
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
