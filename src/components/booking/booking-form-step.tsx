"use client";

import * as React from "react";
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eyebrow } from "@/components/landing/primitives";
import type { InviteData, Slot } from "./booking-types";
import { cn } from "cn";
import {
  focusTargetClass,
  formatFullDate,
  formatSlotTime,
  primaryHoverClass,
} from "./booking-utils";

interface BookingFormStepProps {
  invite: InviteData;
  selectedSlot: Slot;
  timeZone: string;
  guestName: string;
  setGuestName: (val: string) => void;
  guestEmail: string;
  setGuestEmail: (val: string) => void;
  guestNotes: string;
  setGuestNotes: (val: string) => void;
  isBooking: boolean;
  onBackToSlots: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function BookingFormStep({
  invite,
  selectedSlot,
  timeZone,
  guestName,
  setGuestName,
  guestEmail,
  setGuestEmail,
  guestNotes,
  setGuestNotes,
  isBooking,
  onBackToSlots,
  onSubmit,
}: BookingFormStepProps) {
  // The slot button the invitee pressed unmounts with the slot step, so focus
  // moves to this step's summary instead of falling back to <body>.
  const summaryRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    summaryRef.current?.focus();
  }, []);

  return (
    <div className="max-w-md space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBackToSlots}
        className="text-ink-2 hover:text-ink -ml-2 gap-2 text-xs"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to available slots
      </Button>

      <div
        ref={summaryRef}
        tabIndex={-1}
        role="group"
        aria-labelledby="booking-form-heading"
        className={cn("space-y-1.5", focusTargetClass)}
      >
        <Eyebrow as="h2" id="booking-form-heading" className="text-ink-2">
          Selected meeting time
        </Eyebrow>
        <p className="text-ink pt-1 text-base font-medium">
          {formatFullDate(selectedSlot.start, timeZone)}
        </p>
        <p className="text-ink-2 font-code text-sm tabular-nums">
          {formatSlotTime(selectedSlot.start, timeZone)} –{" "}
          {formatSlotTime(selectedSlot.end, timeZone)} · {timeZone}
        </p>
        {invite.locationType !== "room" && (
          // Below md the sidebar's meta is one line, so the Meet note lives here.
          <p className="text-ink-2 text-xs md:hidden">
            Google Meet link generated on confirmation
          </p>
        )}
      </div>

      {invite.isRestricted && (
        <div className="flex items-start gap-3 text-sm">
          <ShieldCheck
            className="text-ink-3 mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="text-ink font-medium">
              Restricted meeting invitation
            </p>
            <p className="text-ink-2 mt-0.5 text-xs">
              Only email addresses pre-approved by the meeting organizer can
              confirm this booking.
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="border-line space-y-4 border-t pt-6"
      >
        <div className="space-y-1.5">
          <Label
            htmlFor="guestName"
            className="text-ink text-xs font-medium"
          >
            Your full name
          </Label>
          <Input
            id="guestName"
            placeholder="e.g. Alex Johnson"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            disabled={isBooking}
            required
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="guestEmail"
            className="text-ink text-xs font-medium"
          >
            Your email address
          </Label>
          <Input
            id="guestEmail"
            type="email"
            placeholder="e.g. alex.johnson@company.com"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            disabled={isBooking}
            required
            className="h-10"
          />
          <p className="text-ink-2 text-xs">
            Meeting confirmation and calendar invites will be sent to this
            address.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="guestNotes"
            className="text-ink text-xs font-medium"
          >
            Additional notes or agenda items (optional)
          </Label>
          <Textarea
            id="guestNotes"
            placeholder="Anything to prepare before the call…"
            rows={3}
            value={guestNotes}
            onChange={(e) => setGuestNotes(e.target.value)}
            disabled={isBooking}
            className="min-h-24"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isBooking}
            className={cn("h-11 w-full gap-2 text-sm", primaryHoverClass)}
          >
            {isBooking ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Scheduling meeting…
              </>
            ) : (
              "Confirm & schedule meeting"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
