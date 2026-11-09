import { db } from "@/db";
import { booking, type Booking } from "@/db/schema";
import { and, ne, sql, inArray, eq, or } from "drizzle-orm";
import { GoogleCalendarService } from "../google-calendar";
import { getOrganizerToken } from "./booking-token-helper";
import { BookingQueryService } from "./booking-query-service";

export function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
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

    const cleanSeriesId = seriesId.trim();
    const escaped = escapeLike(cleanSeriesId);
    const pattern = `%<!--series:${escaped}-->%`;

    const conditions = [
      ne(booking.status, "cancelled"),
      sql`${booking.description} LIKE ${pattern} ESCAPE '\\'`,
    ];

    if (ownerUserId) {
      conditions.push(
        or(
          eq(booking.organizerUserId, ownerUserId),
          eq(booking.userId, ownerUserId),
        )!,
      );
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
    reasonOrCaller?: string,
    callerUserId?: string,
  ): Promise<Booking[]> {
    let reason = reasonOrCaller;
    let callerId = callerUserId;

    if (!callerId && reason && /^[0-9a-f-]{36}$/i.test(reason)) {
      callerId = reason;
      reason = undefined;
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

    const ownerId = targetBooking.organizerUserId || targetBooking.userId;
    if (
      callerId &&
      ownerId &&
      targetBooking.organizerUserId !== callerId &&
      targetBooking.userId !== callerId
    ) {
      throw new Error(
        "Forbidden: You are not authorized to cancel this booking series",
      );
    }

    const seriesMatch = targetBooking.description?.match(
      /<!--series:([a-zA-Z0-9_-]+)-->/,
    );
    if (seriesMatch && seriesMatch[1]) {
      const seriesCancelled = await this.cancelSeries(
        seriesMatch[1],
        reason,
        ownerId || callerId,
      );
      if (seriesCancelled.length > 0) {
        return seriesCancelled;
      }
    }

    const cancelledSingle = await cancelSingleFn(targetBooking.id, reason);
    return [cancelledSingle];
  }
}
