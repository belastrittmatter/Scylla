"use client";

import * as React from "react";
import { format, parse } from "date-fns";
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

/** Client-only values: undefined on the server and during hydration. */
const subscribeNever = () => () => {};
const getServerSnapshot = () => null;

function readTimeZone() {
  try {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh"
    );
  } catch {
    return "Asia/Ho_Chi_Minh";
  }
}

/** The invitee's local calendar date as a stable "yyyy-MM-dd" key. */
function readTodayKey() {
  return format(new Date(), "yyyy-MM-dd");
}

export function MeetingBookingClient({ details }: { details: InviteDetails }) {
  const { invite, organizer, room, members } = details;

  // The zone and today belong to the invitee's browser, not the server, so
  // both resolve after mount; until then the slot step shows its loading state.
  const timeZone = React.useSyncExternalStore(
    subscribeNever,
    readTimeZone,
    getServerSnapshot,
  );
  const todayKey = React.useSyncExternalStore(
    subscribeNever,
    readTodayKey,
    getServerSnapshot,
  );
  const today = React.useMemo(
    () => (todayKey ? parse(todayKey, "yyyy-MM-dd", new Date()) : undefined),
    [todayKey],
  );

  const [pickedDate, setPickedDate] = React.useState<Date | undefined>();
  const selectedDate = pickedDate ?? today;
  const ready = timeZone !== null && today !== undefined;
  // The form and success steps are reachable only after slots load (ready).
  const bookingZone = timeZone ?? "UTC";

  const [slots, setSlots] = React.useState<Slot[]>([]);
  // Starts true: the first paint is "checking", never a false "no times".
  const [loadingSlots, setLoadingSlots] = React.useState<boolean>(true);
  const [slotsError, setSlotsError] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);
  const [selectedSlot, setSelectedSlot] = React.useState<Slot | null>(null);

  const [guestName, setGuestName] = React.useState("");
  const [guestEmail, setGuestEmail] = React.useState("");
  const [guestNotes, setGuestNotes] = React.useState("");
  const [isBooking, setIsBooking] = React.useState(false);

  const [bookedResult, setBookedResult] = React.useState<BookedResult | null>(
    null,
  );

  const selectedKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;

  React.useEffect(() => {
    if (!timeZone || !selectedKey) return;
    let active = true;

    queueMicrotask(async () => {
      if (!active) return;

      setLoadingSlots(true);
      setSlotsError(false);
      setSelectedSlot(null);

      try {
        const res = await fetch(`/api/meeting-invites/${invite.slug}/slots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: selectedKey, timeZone }),
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
          setSlots([]);
          setSlotsError(true);
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
  }, [selectedKey, timeZone, invite.slug, reloadKey]);

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
          timeZone: bookingZone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule meeting");
      }

      setBookedResult(data);
      toast.success("Meeting scheduled successfully!");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to schedule meeting",
      );
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
        timeZone={bookingZone}
        organizer={organizer}
        room={room}
        members={members}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="border-line bg-surface overflow-hidden rounded-xl border">
      <div className="divide-line grid grid-cols-1 divide-y lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:divide-x lg:divide-y-0">
        <BookingDetailsSidebar
          invite={invite}
          organizer={organizer}
          room={room}
          members={members}
        />

        <div className="min-w-0 p-5 sm:p-8">
          {!selectedSlot ? (
            <BookingSlotsStep
              ready={ready}
              selectedDate={selectedDate}
              onSelectDate={setPickedDate}
              slots={slots}
              loadingSlots={loadingSlots}
              slotsError={slotsError}
              onRetry={() => setReloadKey((key) => key + 1)}
              timeZone={timeZone}
              includesRoom={invite.locationType === "room"}
              onSelectSlot={setSelectedSlot}
            />
          ) : (
            <BookingFormStep
              invite={invite}
              selectedSlot={selectedSlot}
              timeZone={bookingZone}
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
    </div>
  );
}
