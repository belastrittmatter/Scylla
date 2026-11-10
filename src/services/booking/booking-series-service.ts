import { db } from "@/db";
import { booking, type Booking } from "@/db/schema";
import { and, ne, sql, inArray, eq } from "drizzle-orm";
import { GoogleCalendarService } from "@/services/google-calendar";
import { getOrganizerToken } from "./booking-token-helper";
import { BookingQueryService } from "./booking-query-service";
import { escapeLike } from "@/utils/sql-utils";

export { escapeLike };

export interface CancelSeriesOptions {
  seriesId: string;
  callerId: string;
  reason?: string;
  bookingId?: never;
}

export interface CancelBookingSeriesOptions {
  bookingId: string;
  callerId: string;
  reason?: string;
  seriesId?: never;
}

function assertCallerId(callerId: string | undefined): void {
  if (!callerId || !callerId.trim()) {
    throw new Error("Caller user ID is required to cancel a series");
  }
}

export class BookingSeriesService {
  public static async cancelSeries({
    seriesId,
    callerId,
    reason,
  }: CancelSeriesOptions): Promise<Booking[]> {
    if (!seriesId || !seriesId.trim()) {
      throw new Error("Series ID is required");
    }
    assertCallerId(callerId);

    const cleanSeriesId = seriesId.trim();
    const escaped = escapeLike(cleanSeriesId);
    const pattern = `%<!--series:${escaped}-->%`;

    const matchingBookings = await db
      .select()
      .from(booking)
      .where(
        and(
          ne(booking.status, "cancelled"),
          sql`${booking.description} LIKE ${pattern} ESCAPE '\\'`,
          eq(booking.organizerUserId, callerId),
        ),
      );

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
    options: CancelSeriesOptions | CancelBookingSeriesOptions,
    cancelSingleFn: (bookingId: string, reason?: string) => Promise<Booking>,
  ): Promise<Booking[]> {
    const { callerId, reason } = options;
    assertCallerId(callerId);

    if (options.seriesId !== undefined) {
      return this.cancelSeries(options);
    }

    const id = options.bookingId;
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

    if (targetBooking.organizerUserId !== callerId) {
      throw new Error(
        "Forbidden: Only the meeting organizer may cancel this booking series",
      );
    }

    const seriesMatch = targetBooking.description?.match(
      /<!--series:([a-zA-Z0-9_-]+)-->/,
    );
    if (seriesMatch && seriesMatch[1]) {
      const seriesCancelled = await this.cancelSeries({
        seriesId: seriesMatch[1],
        callerId,
        reason,
      });
      if (seriesCancelled.length > 0) {
        return seriesCancelled;
      }
    }

    const cancelledSingle = await cancelSingleFn(targetBooking.id, reason);
    return [cancelledSingle];
  }
}
