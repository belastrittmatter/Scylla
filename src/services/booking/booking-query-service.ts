import { db } from "@/db";
import { booking, type Booking } from "@/db/schema";
import { eq, and, or, ne, lt, gt, asc } from "drizzle-orm";
import { UserService } from "../user";

export interface BookingAttendee {
  email: string;
  name?: string;
  status?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class BookingQueryService {
  public static async getBookingById(id: string): Promise<Booking | null> {
    if (!id || !id.trim()) return null;

    if (UUID_REGEX.test(id)) {
      const direct = await db
        .select()
        .from(booking)
        .where(eq(booking.id, id))
        .limit(1);
      if (direct[0]) return direct[0];
    }

    const cleanId = id
      .replace(/^gcal-/, "")
      .replace(/^attendee-[^-]+-/, "")
      .replace(/^busy-[^-]+-/, "");

    const results = await db
      .select()
      .from(booking)
      .where(
        or(
          eq(booking.id, id),
          eq(booking.id, cleanId),
          eq(booking.gcalEventId, id),
          eq(booking.gcalEventId, cleanId),
          eq(booking.googleEventId, id),
          eq(booking.googleEventId, cleanId),
        ),
      )
      .limit(1);

    return results[0] || null;
  }

  public static async getAgenda(
    userId: string,
    date: Date | string,
  ): Promise<Booking[]> {
    const target = new Date(date);
    if (isNaN(target.getTime())) {
      throw new Error("Invalid date provided for agenda");
    }

    const dayStart = new Date(
      Date.UTC(
        target.getUTCFullYear(),
        target.getUTCMonth(),
        target.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const dayEnd = new Date(
      Date.UTC(
        target.getUTCFullYear(),
        target.getUTCMonth(),
        target.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const [userRecord, bookings] = await Promise.all([
      UserService.getUserById(userId),
      db
        .select()
        .from(booking)
        .where(
          and(
            ne(booking.status, "cancelled"),
            lt(booking.startTime, dayEnd),
            gt(booking.endTime, dayStart),
          ),
        )
        .orderBy(asc(booking.startTime)),
    ]);

    const userEmail = userRecord?.email?.toLowerCase();

    return bookings.filter((b) => {
      const isOrganizer = b.organizerUserId === userId || b.userId === userId;
      const isAttendee =
        userEmail &&
        Array.isArray(b.attendees) &&
        b.attendees.some(
          (a) =>
            typeof a === "object" &&
            a !== null &&
            (a as BookingAttendee).email?.toLowerCase() === userEmail,
        );
      return isOrganizer || isAttendee;
    });
  }
}
