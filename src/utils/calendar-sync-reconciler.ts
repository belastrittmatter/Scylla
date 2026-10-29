import { db } from "@/db";
import { booking } from "@/db/schema";
import { inArray } from "drizzle-orm";

export interface BookingReconcileCandidate {
  id: string;
  gcalEventId: string | null;
  googleEventId: string | null;
  startTime: Date;
  endTime: Date;
  status: string;
}

/**
 * Reconciles DB bookings against Google Calendar event IDs for the active window.
 * If a DB booking is linked to a Google event (`gcalEventId` or `googleEventId`),
 * falls within the active query window [timeMin, timeMax], but is no longer present
 * in the active Google Calendar events, it marks the booking as cancelled in the database.
 *
 * Returns the set of booking IDs that were cancelled.
 */
export async function reconcileDeletedGoogleEvents(params: {
  bookings: BookingReconcileCandidate[];
  activeGcalIds: Set<string>;
  cancelledGcalIds?: Set<string>;
  timeMinIso: string;
  timeMaxIso: string;
}): Promise<Set<string>> {
  const {
    bookings,
    activeGcalIds,
    cancelledGcalIds = new Set(),
    timeMinIso,
    timeMaxIso,
  } = params;

  const minMs = new Date(timeMinIso).getTime();
  const maxMs = new Date(timeMaxIso).getTime();

  const toCancelIds: string[] = [];

  for (const b of bookings) {
    if (b.status === "cancelled") continue;

    const gcalId = b.gcalEventId || b.googleEventId;
    if (!gcalId) continue;

    // 1. Explicit cancellation reported by Google Calendar
    if (
      cancelledGcalIds.has(gcalId) ||
      cancelledGcalIds.has(`gcal-${gcalId}`)
    ) {
      toCancelIds.push(b.id);
      continue;
    }

    // 2. Booking falls within the active window, but is absent from active Google Calendar events
    const bStartMs = new Date(b.startTime).getTime();
    const bEndMs = new Date(b.endTime).getTime();

    // Check if the booking overlaps or falls in the queried window
    const isInWindow = bStartMs >= minMs && bEndMs <= maxMs;
    if (isInWindow) {
      const isPresentInGoogle =
        activeGcalIds.has(gcalId) ||
        activeGcalIds.has(`gcal-${gcalId}`) ||
        Array.from(activeGcalIds).some(
          (id) => id.replace(/^gcal-/, "") === gcalId,
        );

      if (!isPresentInGoogle) {
        toCancelIds.push(b.id);
      }
    }
  }

  if (toCancelIds.length > 0) {
    try {
      await db
        .update(booking)
        .set({
          status: "cancelled",
          cancellationReason: "Deleted on Google Calendar",
          updatedAt: new Date(),
        })
        .where(inArray(booking.id, toCancelIds));
    } catch (err) {
      console.warn("Failed to update cancelled bookings in database:", err);
    }
  }

  return new Set(toCancelIds);
}
