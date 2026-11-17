"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Building2,
  CheckCircle2,
  CalendarPlus,
} from "lucide-react";
import { Eyebrow } from "@/components/landing/primitives";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import type {
  BookedResult,
  InviteOrganizer,
  InviteRoom,
  InviteMember,
} from "./booking-types";
import {
  formatSlotTime,
  formatFullDate,
  buildGoogleCalendarUrl,
  focusTargetClass,
  primaryHoverClass,
} from "./booking-utils";

const chipClass =
  "border-line text-ink inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs";

interface BookingSuccessViewProps {
  bookedResult: BookedResult;
  guestEmail: string;
  guestName: string;
  timeZone: string;
  organizer: InviteOrganizer | null;
  room: InviteRoom | null;
  members: InviteMember[];
  onReset: () => void;
}

export function BookingSuccessView({
  bookedResult,
  guestEmail,
  guestName,
  timeZone,
  organizer,
  room,
  members,
  onReset,
}: BookingSuccessViewProps) {
  const meetUrl =
    bookedResult.booking.googleMeetUrl || bookedResult.booking.meetingUrl;

  const attendeeCount = (organizer ? 1 : 0) + members.length + 1;
  const rowClass = "text-ink flex items-start gap-3 text-sm";
  const iconClass = "text-ink-3 mt-0.5 size-4 shrink-0";

  // The form unmounts on success; land focus on the confirmation heading.
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="border-line bg-surface mx-auto max-w-xl rounded-xl border">
      <div className="border-line border-b p-5 sm:p-8">
        <CheckCircle2 className="text-ember size-6" aria-hidden="true" />
        <h1
          ref={headingRef}
          tabIndex={-1}
          className={cn(
            "text-ink mt-4 text-balance text-3xl font-medium leading-tight tracking-[-0.02em]",
            focusTargetClass,
          )}
        >
          You&apos;re scheduled
        </h1>
        <p className="text-ink-2 mt-2 text-sm">
          A calendar invitation has been sent to{" "}
          <span className="text-ink font-medium">{guestEmail}</span>
        </p>
      </div>

      <div className="space-y-6 p-5 sm:p-8">
        <div className="space-y-3">
          <h2 className="text-ink text-base font-medium">
            {bookedResult.booking.title}
          </h2>

          <div className={rowClass}>
            <CalendarIcon className={iconClass} aria-hidden="true" />
            <span>
              {formatFullDate(bookedResult.booking.startTime, timeZone)}
            </span>
          </div>

          <div className={rowClass}>
            <Clock className={iconClass} aria-hidden="true" />
            <span className="font-code tabular-nums">
              {formatSlotTime(bookedResult.booking.startTime, timeZone)} –{" "}
              {formatSlotTime(bookedResult.booking.endTime, timeZone)} ·{" "}
              {timeZone}
            </span>
          </div>

          {meetUrl ? (
            <div className={rowClass}>
              <Video className={iconClass} aria-hidden="true" />
              <a
                href={meetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-ember-deep hover:text-ink font-medium underline underline-offset-4"
              >
                Google Meet Video Call
              </a>
            </div>
          ) : room ? (
            <div className={rowClass}>
              <Building2 className={iconClass} aria-hidden="true" />
              <div>
                <span className="font-medium">{room.name}</span>
                {room.building && <span> · {room.building}</span>}
                {room.floor && <span> (Floor {room.floor})</span>}
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-line space-y-3 border-t pt-6">
          <Eyebrow as="h3" className="text-ink-2">
            Confirmed attendees{" "}
            <span className="tabular-nums">({attendeeCount})</span>
          </Eyebrow>
          <ul className="flex flex-wrap gap-2">
            {organizer && (
              <li className={chipClass}>
                {organizer.name}
                <span className="text-ink-2">(host)</span>
              </li>
            )}
            {members.map((m) => (
              <li key={m.id} className={chipClass}>
                {m.name}
              </li>
            ))}
            <li className={chipClass}>
              {guestName}
              <span className="text-ink-2">(guest)</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={buildGoogleCalendarUrl(
              bookedResult.booking,
              bookedResult.invite,
              room,
            )}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-10 flex-1 gap-2",
              primaryHoverClass,
            )}
          >
            <CalendarPlus className="size-4" aria-hidden="true" />
            Add to Google Calendar
          </a>

          {meetUrl && (
            <a
              href={meetUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-10 flex-1 gap-2",
              )}
            >
              <Video className="size-4" aria-hidden="true" />
              Open Google Meet
            </a>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-ink-2 hover:text-ink -ml-2 text-xs"
          onClick={onReset}
        >
          Book another meeting
        </Button>
      </div>
    </div>
  );
}
