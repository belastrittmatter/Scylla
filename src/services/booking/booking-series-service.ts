import { db } from "@/db";
import { booking, type Booking } from "@/db/schema";
import { and, ne, sql, inArray, eq } from "drizzle-orm";
import { GoogleCalendarService } from "@/services/google-calendar";
import { getOrganizerToken } from "./booking-token-helper";
import { BookingQueryService } from "./booking-query-service";
import { escapeLike } from "@/utils/sql-utils";

export { escapeLike };

export interface CancelSeriesOptions {
  reason?: string;
  callerUserId?: string;
}

export class BookingSeriesService {
  public static async cancelSeries(
    seriesId: string,
    reason?: string,
    ownerUserId?: string,
  ): Promise<Booking[]> {
    if (!seriesId || !seriesId.trim()) {
      throw new Error("Series ID is required");
    }
    if (ownerUserId !== undefined && !ownerUserId.trim()) {
      throw new Error("Owner user ID cannot be empty");
    }

    const cleanSeriesId = seriesId.trim();
    const escaped = escapeLike(cleanSeriesId);
    const pattern = `%<!--series:${escaped}-->%`;

    const conditions = [
      ne(booking.status, "cancelled"),
      sql`${booking.description} LIKE ${pattern} ESCAPE '\\'`,
    ];

    if (ownerUserId) {
      conditions.push(eq(booking.organizerUserId, ownerUserId));
    }

    const matchingBookings = await db
      .select()
      .from(booking)
      .where(and(...conditions));

    if (matchingBookings.length === 0) {
      return [];
    }

    await Promise.all(
      matchingBookings.map(async (b) => {
        if (b.gcalEventId) {
          const token = await getOrganizerToken(b.organizerUserId);
          return GoogleCalendarService.deleteEvent(
            b.gcalEventId,
            "primary",
            token,
          ).catch(() => {});
        }
      }),
    );

    const ids = matchingBookings.map((b) => b.id);
    const cancelled = await db
      .update(booking)
      .set({
        status: "cancelled",
        cancellationReason: reason || null,
        updatedAt: new Date(),
      })
      .where(inArray(booking.id, ids))
      .returning();

    return cancelled;
  }

  public static async cancelSeriesByBooking(
    id: string,
    cancelSingleFn: (bookingId: string, reason?: string) => Promise<Booking>,
    optionsOrReason?: CancelSeriesOptions | string,
    callerUserIdParam?: string,
  ): Promise<Booking[]> {
    let reason: string | undefined;
    let callerId: string | undefined;

    if (
      optionsOrReason &&
      typeof optionsOrReason === "object" &&
      !("length" in optionsOrReason)
    ) {
      reason = optionsOrReason.reason;
      callerId = optionsOrReason.callerUserId;
    } else if (typeof optionsOrReason === "string") {
      reason = optionsOrReason;
      callerId = callerUserIdParam;
      if (!callerId && /^[0-9a-f-]{36}$/i.test(reason)) {
        callerId = reason;
        reason = undefined;
      }
    } else {
      callerId = callerUserIdParam;
    }

    if (id.startsWith("series_")) {
      if (!callerId) {
        throw new Error("Authentication required to cancel series");
      }
      return this.cancelSeries(id, reason, callerId);
    }

    const cleanId = id.replace(/^gcal-/, "");
    const targetBooking = await BookingQueryService.getBookingById(id);
    if (!targetBooking) {
      try {
        await GoogleCalendarService.deleteEvent(cleanId);
      } catch (gcalErr) {
        console.warn("Could not delete gcal event:", gcalErr);
      }
      return [];
    }

    const organizerId = targetBooking.organizerUserId;
    if (callerId && organizerId && organizerId !== callerId) {
      throw new Error(
        "Forbidden: Only the meeting organizer may cancel this booking series",
      );
    }

    const seriesMatch = targetBooking.description?.match(
      /<!--series:([a-zA-Z0-9_-]+)-->/,
    );
    if (seriesMatch && seriesMatch[1]) {
      const seriesCancelled = await this.cancelSeries(
        seriesMatch[1],
        reason,
        organizerId || callerId,
      );
      if (seriesCancelled.length > 0) {
        return seriesCancelled;
      }
    }

    const cancelledSingle = await cancelSingleFn(targetBooking.id, reason);
    return [cancelledSingle];
  }
}
