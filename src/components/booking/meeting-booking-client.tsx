"use client";

import * as React from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type { InviteDetails, Slot, BookedResult } from "./booking-types";
import { BookingSuccessView } from "./booking-success-view";
import { BookingDetailsSidebar } from "./booking-details-sidebar";
import { BookingSlotsStep } from "./booking-slots-step";
import { BookingFormStep } from "./booking-form-step";

export type {
  InviteOrganizer,
  InviteMember,
  InviteRoom,
  InviteData,
  InviteDetails,
} from "./booking-types";

export function MeetingBookingClient({ details }: { details: InviteDetails }) {
  const { invite, organizer, room, members } = details;

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(() => new Date());

  const [timeZone] = React.useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh";
    } catch {
      return "Asia/Ho_Chi_Minh";
    }
  });

  const [slots, setSlots] = React.useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = React.useState<Slot | null>(null);

  const [guestName, setGuestName] = React.useState("");
  const [guestEmail, setGuestEmail] = React.useState("");
  const [guestNotes, setGuestNotes] = React.useState("");
  const [isBooking, setIsBooking] = React.useState(false);

  const [bookedResult, setBookedResult] = React.useState<BookedResult | null>(null);

  React.useEffect(() => {
    let active = true;

    queueMicrotask(async () => {
      if (!active) return;

      if (!selectedDate) {
        setSlots([]);
        return;
      }

      const dateStr = format(selectedDate, "yyyy-MM-dd");
      setLoadingSlots(true);
      setSelectedSlot(null);

      try {
        const res = await fetch(`/api/meeting-invites/${invite.slug}/slots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: dateStr, timeZone }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load slots");
        }

        const data = await res.json();
        if (active) {
          setSlots(data.slots || []);
        }
      } catch (err) {
        if (active) {
          console.error("Slots fetch error:", err);
          toast.error("Could not load available slots for this date");
          setSlots([]);
        }
      } finally {
        if (active) {
          setLoadingSlots(false);
        }
      }
    });

    return () => {
      active = false;
    };
  }, [selectedDate, timeZone, invite.slug]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    if (!guestName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!guestEmail.trim() || !guestEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsBooking(true);
    try {
      const res = await fetch(`/api/meeting-invites/${invite.slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim().toLowerCase(),
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
          notes: guestNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule meeting");
      }

      setBookedResult(data);
      toast.success("Meeting scheduled successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to schedule meeting");
    } finally {
      setIsBooking(false);
    }
  };

  const handleReset = () => {
    setBookedResult(null);
    setSelectedSlot(null);
    setGuestName("");
    setGuestNotes("");
  };

  if (bookedResult) {
    return (
      <BookingSuccessView
        bookedResult={bookedResult}
        guestEmail={guestEmail}
        guestName={guestName}
        timeZone={timeZone}
        organizer={organizer}
        room={room}
        members={members}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="border-border bg-card w-full max-w-5xl overflow-hidden rounded-3xl shadow-2xl">
        <div className="divide-border grid grid-cols-1 divide-y md:grid-cols-12 md:divide-x md:divide-y-0">
          <BookingDetailsSidebar
            invite={invite}
            organizer={organizer}
            room={room}
            members={members}
            timeZone={timeZone}
          />

          <div className="p-6 md:col-span-8 lg:p-8">
            {!selectedSlot ? (
              <BookingSlotsStep
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                slots={slots}
                loadingSlots={loadingSlots}
                timeZone={timeZone}
                onSelectSlot={setSelectedSlot}
              />
            ) : (
              <BookingFormStep
                invite={invite}
                selectedSlot={selectedSlot}
                timeZone={timeZone}
                guestName={guestName}
                setGuestName={setGuestName}
                guestEmail={guestEmail}
                setGuestEmail={setGuestEmail}
                guestNotes={guestNotes}
                setGuestNotes={setGuestNotes}
                isBooking={isBooking}
                onBackToSlots={() => setSelectedSlot(null)}
                onSubmit={handleBookingSubmit}
              />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
