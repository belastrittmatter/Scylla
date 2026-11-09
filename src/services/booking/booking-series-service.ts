import { db } from "@/db";
import { booking, type Booking } from "@/db/schema";
import { and, ne, like, inArray } from "drizzle-orm";
import { GoogleCalendarService } from "../google-calendar";
import { getOrganizerToken } from "./booking-token-helper";
import { BookingQueryService } from "./booking-query-service";

export class BookingSeriesService {
  public static async cancelSeries(
    seriesId: string,
    reason?: string,
  ): Promise<Booking[]> {
    if (!seriesId || !seriesId.trim()) {
      throw new Error("Series ID is required");
    }

    const matchingBookings = await db
      .select()
      .from(booking)
      .where(
        and(
          ne(booking.status, "cancelled"),
          like(booking.description, `%<!--series:${seriesId}-->%`),
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
    id: string,
    cancelSingleFn: (bookingId: string, reason?: string) => Promise<Booking>,
    reason?: string,
  ): Promise<Booking[]> {
    if (id.startsWith("series_")) {
      return this.cancelSeries(id, reason);
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

    const seriesMatch = targetBooking.description?.match(
      /<!--series:([a-zA-Z0-9_-]+)-->/,
    );
    if (seriesMatch && seriesMatch[1]) {
      const seriesCancelled = await this.cancelSeries(seriesMatch[1], reason);
      if (seriesCancelled.length > 0) {
        return seriesCancelled;
      }
    }

    const cancelledSingle = await cancelSingleFn(targetBooking.id, reason);
    return [cancelledSingle];
  }
}
