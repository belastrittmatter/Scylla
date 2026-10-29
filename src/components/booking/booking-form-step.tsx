"use client";

import * as React from "react";
import { ArrowLeft, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";
import type { InviteData, Slot } from "./booking-types";
import { formatFullDate, formatSlotTime } from "./booking-utils";

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
  const isGuestEmailAllowed = (email: string) => {
    if (
      !invite.isRestricted ||
      !invite.allowedEmails ||
      invite.allowedEmails.length === 0
    ) {
      return true;
    }
    const clean = email.trim().toLowerCase();
    return invite.allowedEmails.some(
      (allowed) => allowed.toLowerCase() === clean,
    );
  };

  const isEmailRestrictedMismatch =
    Boolean(invite.isRestricted) &&
    guestEmail.includes("@") &&
    guestEmail.includes(".") &&
    !isGuestEmailAllowed(guestEmail);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBackToSlots}
        className="text-muted-foreground hover:text-foreground -ml-2 gap-2 rounded-lg text-xs"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to available slots
      </Button>

      <div className="bg-muted/30 border-border space-y-1 rounded-2xl border p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
          Selected Meeting Time
        </p>
        <p className="text-foreground text-base font-bold">
          {formatFullDate(selectedSlot.start, timeZone)}
        </p>
        <p className="text-muted-foreground text-sm font-medium">
          {formatSlotTime(selectedSlot.start, timeZone)} -{" "}
          {formatSlotTime(selectedSlot.end, timeZone)} ({timeZone})
        </p>
      </div>

      {invite.isRestricted && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-3.5 text-xs">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
          <div>
            <p className="text-foreground font-semibold">
              Restricted Meeting Invitation
            </p>
            <p className="text-muted-foreground mt-0.5 text-[11px]">
              Only email addresses pre-approved by the meeting organizer can
              confirm this booking.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="guestName"
            className="text-foreground text-xs font-medium"
          >
            Your Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="guestName"
            placeholder="e.g. Alex Johnson"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            disabled={isBooking}
            required
            className="rounded-xl focus-visible:ring-orange-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="guestEmail"
            className="text-foreground text-xs font-medium"
          >
            Your Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="guestEmail"
            type="email"
            placeholder="e.g. alex.johnson@company.com"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            disabled={isBooking}
            required
            className={cn(
              "rounded-xl focus-visible:ring-orange-500",
              isEmailRestrictedMismatch &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          {isEmailRestrictedMismatch ? (
            <p className="text-destructive flex items-center gap-1 text-[11px] font-medium">
              <AlertCircle className="size-3.5 shrink-0" />
              This email is not on the authorized guest list for this meeting.
            </p>
          ) : (
            <p className="text-muted-foreground text-[11px]">
              Meeting confirmation and calendar invites will be sent to this
              address.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="guestNotes"
            className="text-foreground text-xs font-medium"
          >
            Additional Notes or Agenda Items (Optional)
          </Label>
          <Textarea
            id="guestNotes"
            placeholder="Please share anything that will help prepare for our discussion..."
            rows={3}
            value={guestNotes}
            onChange={(e) => setGuestNotes(e.target.value)}
            disabled={isBooking}
            className="rounded-xl focus-visible:ring-orange-500"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isBooking || isEmailRestrictedMismatch}
            className="h-11 w-full gap-2 rounded-xl bg-orange-600 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-500"
          >
            {isBooking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scheduling meeting...
              </>
            ) : (
              "Confirm & Schedule Meeting"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
