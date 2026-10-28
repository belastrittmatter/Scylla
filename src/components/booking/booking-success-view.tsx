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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "cn";
import type { BookedResult, InviteOrganizer, InviteRoom, InviteMember } from "./booking-types";
import { formatSlotTime, formatFullDate, buildGoogleCalendarUrl } from "./booking-utils";

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
  const meetUrl = bookedResult.booking.googleMeetUrl || bookedResult.booking.meetingUrl;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="border-border bg-card w-full max-w-xl shadow-xl">
        <CardHeader className="pb-2 pt-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 ring-8 ring-orange-500/5">
            <CheckCircle2 className="h-10 w-10 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-foreground text-2xl font-bold tracking-tight">
            You&apos;re Scheduled!
          </CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            A calendar invitation has been sent to{" "}
            <span className="text-foreground font-semibold">{guestEmail}</span>
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pb-8 pt-4">
          <div className="bg-muted/30 border-border space-y-3 rounded-2xl border p-4">
            <h3 className="text-foreground text-base font-semibold">
              {bookedResult.booking.title}
            </h3>

            <div className="text-foreground/80 flex items-center gap-2.5 text-sm">
              <CalendarIcon className="h-4 w-4 shrink-0 text-orange-500" />
              <span>{formatFullDate(bookedResult.booking.startTime, timeZone)}</span>
            </div>

            <div className="text-foreground/80 flex items-center gap-2.5 text-sm">
              <Clock className="h-4 w-4 shrink-0 text-orange-500" />
              <span>
                {formatSlotTime(bookedResult.booking.startTime, timeZone)} -{" "}
                {formatSlotTime(bookedResult.booking.endTime, timeZone)} ({timeZone})
              </span>
            </div>

            {meetUrl ? (
              <div className="text-foreground/80 flex items-center gap-2.5 text-sm">
                <Video className="h-4 w-4 shrink-0 text-orange-500" />
                <a
                  href={meetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-orange-600 underline hover:text-orange-500 dark:text-orange-400"
                >
                  Google Meet Video Call
                </a>
              </div>
            ) : room ? (
              <div className="text-foreground/80 flex items-center gap-2.5 text-sm">
                <Building2 className="h-4 w-4 shrink-0 text-orange-500" />
                <div>
                  <span className="font-semibold">{room.name}</span>
                  {room.building && <span> • {room.building}</span>}
                  {room.floor && <span> (Floor {room.floor})</span>}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Confirmed Attendees ({1 + members.length + 1})
            </span>
            <div className="flex flex-wrap gap-2">
              {organizer && (
                <Badge
                  variant="outline"
                  className="text-foreground gap-1.5 border-orange-500/30 bg-orange-500/5 px-2.5 py-1"
                >
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  {organizer.name} (Host)
                </Badge>
              )}
              {members.map((m) => (
                <Badge key={m.id} variant="outline" className="border-border gap-1.5 px-2.5 py-1">
                  <span className="bg-muted-foreground h-2 w-2 rounded-full" />
                  {m.name || m.email}
                </Badge>
              ))}
              <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 font-medium">
                <span className="bg-foreground h-2 w-2 rounded-full" />
                {guestName} (Guest)
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <a
              href={buildGoogleCalendarUrl(bookedResult.booking, bookedResult.invite, room)}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-10 flex-1 gap-2 rounded-xl bg-orange-600 font-medium text-white shadow-sm hover:bg-orange-500"
              )}
            >
              <CalendarPlus className="h-4 w-4" />
              Add to Google Calendar
            </a>

            {meetUrl && (
              <a
                href={meetUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "border-border text-foreground hover:bg-muted/60 h-10 flex-1 gap-2 rounded-xl font-medium"
                )}
              >
                <Video className="h-4 w-4" />
                Open Google Meet
              </a>
            )}
          </div>

          <div className="pt-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground text-xs"
              onClick={onReset}
            >
              Book another meeting
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
