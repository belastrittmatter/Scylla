"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
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
  Copy,
  Check,
  Trash2,
  Loader2,
  Pencil,
} from "lucide-react";
import type { MeetingItem } from "@/mock-data/meetings-data";
import { HtmlDescriptionViewer } from "@/components/ui/html-description-viewer";
import { HtmlDescriptionEditor } from "@/components/ui/html-description-editor";
import { apiClient } from "@/lib/api-client";
import { copyToClipboard } from "@/lib/clipboard";
import { toast } from "sonner";
import { MeetingDetailLocationSection } from "./meeting-detail-location-section";
import { MeetingDetailAttendeesSection } from "./meeting-detail-attendees-section";

interface MeetingDetailDialogProps {
  meeting: MeetingItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteMeeting: (id: string) => Promise<void> | void;
  onUpdateMeeting?: (updated: MeetingItem) => void;
}

export function MeetingDetailDialog({
  meeting,
  open,
  onOpenChange,
  onDeleteMeeting,
  onUpdateMeeting,
}: MeetingDetailDialogProps) {
  const [copied, setCopied] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isEditingDescription, setIsEditingDescription] = React.useState(false);
  const [isSavingDescription, setIsSavingDescription] = React.useState(false);
  const [attendeeFilter, setAttendeeFilter] = React.useState("");

  // Reset editing mode and filter when dialog closes or selected meeting changes
  const [prevKey, setPrevKey] = React.useState({ open, meetingId: meeting?.id });
  if (prevKey.open !== open || prevKey.meetingId !== meeting?.id) {
    setPrevKey({ open, meetingId: meeting?.id });
    setIsEditingDescription(false);
    if (!open) {
      setAttendeeFilter("");
    }
  }

  const filteredAttendees = React.useMemo(() => {
    if (!meeting) return [];
    if (!attendeeFilter.trim()) return meeting.attendees;
    const q = attendeeFilter.toLowerCase();
    return meeting.attendees.filter(
      (a) =>
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q))
    );
  }, [meeting, attendeeFilter]);

  if (!meeting) return null;

  const handleSaveDescription = async (newHtml: string) => {
    setIsSavingDescription(true);
    try {
      await apiClient.bookings.update(meeting.id, {
        description: newHtml,
      });
      onUpdateMeeting?.({
        ...meeting,
        description: newHtml,
      });
      toast.success("Agenda notes saved successfully.");
      setIsEditingDescription(false);
    } catch {
      toast.error("Failed to save agenda notes. Please try again.");
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleCopyLink = async () => {
    const link = meeting.meetingUrl || `https://meet.google.com/room/${meeting.id}`;
    const ok = await copyToClipboard(link);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinCall = () => {
    if (meeting.meetingUrl) {
      window.open(meeting.meetingUrl, "_blank", "noopener,noreferrer");
    }
  };

  const isLive = meeting.status === "in-progress";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background text-foreground max-h-[88vh] max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-2xl">
        <DialogHeader className="pb-1">
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                Live Now
              </span>
            ) : meeting.status === "upcoming" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-950/50 dark:text-orange-300">
                Upcoming
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                Completed
              </span>
            )}

            {meeting.tags?.map((t) => (
              <span
                key={t}
                className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800"
              >
                #{t}
              </span>
            ))}
          </div>

          <DialogTitle className="mt-2 break-words text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {meeting.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-xs">
          {/* Time & Date */}
          <div className="flex items-center gap-4 rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-800/40">
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <CalendarIcon className="size-4 shrink-0 text-neutral-400" />
              <span className="font-semibold">
                {format(parseISO(meeting.date), "EEEE, MMMM d, yyyy")}
              </span>
            </div>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
              <Clock className="size-4 shrink-0 text-neutral-400" />
              <span>
                {meeting.startTime} – {meeting.endTime} ({meeting.duration})
              </span>
            </div>
          </div>

          {/* Agenda / Notes (HTML Rich Text Viewer & Editor) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Agenda / Notes
              </label>
              {!isEditingDescription && (
                <button
                  type="button"
                  onClick={() => setIsEditingDescription(true)}
                  className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700 hover:underline dark:text-orange-400"
                >
                  <Pencil className="size-3" />
                  <span>{meeting.description ? "Edit notes" : "Add notes"}</span>
                </button>
              )}
            </div>

            {isEditingDescription ? (
              <HtmlDescriptionEditor
                initialValue={meeting.description || ""}
                onSave={handleSaveDescription}
                onCancel={() => setIsEditingDescription(false)}
                isSaving={isSavingDescription}
              />
            ) : (
              <div className="max-h-40 overflow-y-auto break-words rounded-lg border border-neutral-200/80 bg-neutral-50/40 p-3.5 dark:border-neutral-800 dark:bg-neutral-800/40">
                <HtmlDescriptionViewer
                  html={meeting.description}
                  emptyPlaceholder="No agenda notes provided yet. Click 'Add notes' above to outline topics or action items."
                />
              </div>
            )}
          </div>

          {/* Location & Room Details */}
          <MeetingDetailLocationSection meeting={meeting} onJoinCall={handleJoinCall} />

          {/* Organizer & Attendees */}
          <MeetingDetailAttendeesSection
            meeting={meeting}
            attendeeFilter={attendeeFilter}
            onFilterChange={setAttendeeFilter}
            filteredAttendees={filteredAttendees}
          />
        </div>

        <DialogFooter className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            onClick={async () => {
              setIsDeleting(true);
              try {
                await onDeleteMeeting(meeting.id);
                onOpenChange(false);
              } finally {
                setIsDeleting(false);
              }
            }}
            className="h-8 gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <Trash2 className="size-3.5" />
                Delete meeting
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  Copy Link
                </>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
