import { db } from "@/db";
import { booking, account, type Booking } from "@/db/schema";
import { eq, and, ne, gte, lte, asc } from "drizzle-orm";
import { GoogleCalendarService } from "./google-calendar";
import { RoomService } from "./rooms";
import { UserService } from "./user";

export interface BookingAttendee {
  email: string;
  name?: string;
  status?: string;
}

export interface CreateBookingPayload {
  title: string;
  description?: string;
  eventTypeId?: string;
  organizerUserId: string;
  roomId?: string;
  projectId?: string | null;
  startTime: Date | string;
  endTime: Date | string;
  attendees?: Array<string | BookingAttendee>;
}

export interface ReschedulePayload {
  startTime?: Date | string;
  endTime?: Date | string;
  roomId?: string;
  projectId?: string | null;
  title?: string;
  description?: string;
}

function normalizeAttendees(attendees?: Array<string | BookingAttendee>): BookingAttendee[] {
  if (!attendees) return [];
  return attendees.map((a) => {
    if (typeof a === "string") {
      return { email: a.trim().toLowerCase(), status: "needsAction" };
    }
    return {
      email: a.email.trim().toLowerCase(),
      name: a.name,
      status: a.status || "needsAction",
    };
  });
}

export class BookingService {
  /**
   * Creates a new booking atomically:
   * 1. Creates a Google Calendar event with a Google Meet conference link.
   * 2. Inserts the booking record into PostgreSQL.
   * 3. Rolls back Google Calendar event if the database transaction fails.
   */
  public static async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    const start = new Date(payload.startTime);
    const end = new Date(payload.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid start or end time");
    }
    if (start >= end) {
      throw new Error("startTime must be before endTime");
    }

    const normalized = normalizeAttendees(payload.attendees);

    // Resolve room email and organizer's Google OAuth access token in parallel
    const [room, organizerToken] = await Promise.all([
      payload.roomId ? RoomService.getRoomById(payload.roomId) : Promise.resolve(null),
      payload.organizerUserId
        ? (async () => {
            try {
              const userAccounts = await db
                .select()
                .from(account)
                .where(
                  and(eq(account.userId, payload.organizerUserId), eq(account.providerId, "google"))
                )
                .limit(1);

              if (userAccounts.length > 0) {
                return (
                  (await GoogleCalendarService.refreshAccountToken(userAccounts[0])) ||
                  userAccounts[0].accessToken ||
                  undefined
                );
              }
            } catch (tokenErr) {
              console.warn("Could not retrieve organizer Google token:", tokenErr);
            }
            return undefined;
          })()
        : Promise.resolve(undefined),
    ]);
    const roomEmail = room?.email;

    // 1. Create Google Calendar event with conference link
    const gcalEvent = await GoogleCalendarService.createEvent(
      {
        title: payload.title,
        description: payload.description,
        start,
        end,
        attendees: normalized.map((a) => ({
          email: a.email,
          name: a.name,
        })),
        roomEmail,
        conference: true,
      },
      organizerToken
    );

    try {
      // 2. Persist booking to database
      const [newBooking] = await db
        .insert(booking)
        .values({
          title: payload.title,
          description: payload.description,
          eventTypeId: payload.eventTypeId,
          organizerUserId: payload.organizerUserId,
          roomId: payload.roomId,
          projectId: payload.projectId || null,
          startTime: start,
          endTime: end,
          status: "confirmed",
          attendees: normalized,
          gcalEventId: gcalEvent.id,
          meetingUrl: gcalEvent.meetingUrl || gcalEvent.hangoutsLink,
        })
        .returning();

      return newBooking;
    } catch (err) {
      // If DB persistence fails, rollback the Google Calendar event
      if (gcalEvent.id) {
        await GoogleCalendarService.deleteEvent(gcalEvent.id).catch(() => {});
      }
      throw err;
    }
  }

  /**
   * Reschedules an existing booking to new start and end times,
   * updating both the Google Calendar event and database record.
   */
  public static async reschedule(id: string, payload: ReschedulePayload): Promise<Booking> {
    const existing = await this.getBookingById(id);
    if (!existing) {
      throw new Error(`Booking with ID ${id} not found`);
    }

    if (existing.status === "cancelled") {
      throw new Error("Cannot reschedule a cancelled booking");
    }

    const start = payload.startTime ? new Date(payload.startTime) : existing.startTime;
    const end = payload.endTime ? new Date(payload.endTime) : existing.endTime;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid start or end time");
    }
    if (start >= end) {
      throw new Error("startTime must be before endTime");
    }

    const targetRoomId = payload.roomId !== undefined ? payload.roomId : existing.roomId;
    let roomEmail: string | undefined;
    if (targetRoomId) {
      const room = await RoomService.getRoomById(targetRoomId);
      if (room) {
        roomEmail = room.email;
      }
    }

    const targetProjectId =
      payload.projectId !== undefined ? payload.projectId : existing.projectId;
    const targetTitle = payload.title !== undefined ? payload.title : existing.title;
    const targetDescription =
      payload.description !== undefined ? payload.description : existing.description;

    // Sync changes to Google Calendar
    if (existing.gcalEventId) {
      await GoogleCalendarService.updateEvent(existing.gcalEventId, {
        start,
        end,
        roomEmail,
        title: targetTitle,
        description: targetDescription || undefined,
      });
    }

    // Update database record
    const [updated] = await db
      .update(booking)
      .set({
        startTime: start,
        endTime: end,
        roomId: targetRoomId,
        projectId: targetProjectId,
        title: targetTitle,
        description: targetDescription,
        updatedAt: new Date(),
      })
      .where(eq(booking.id, id))
      .returning();

    return updated;
  }

  /**
   * Cancels a booking, updates its status to 'cancelled', and deletes the Google Calendar event.
   */
  public static async cancel(id: string): Promise<Booking> {
    const existing = await this.getBookingById(id);
    if (!existing) {
      throw new Error(`Booking with ID ${id} not found`);
    }

    if (existing.gcalEventId) {
      await GoogleCalendarService.deleteEvent(existing.gcalEventId).catch(() => {});
    }

    const [cancelled] = await db
      .update(booking)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(booking.id, id))
      .returning();

    return cancelled;
  }

  /**
   * Retrieves user agenda for a specified date (all confirmed bookings
   * where user is organizer or attendee).
   */
  public static async getAgenda(userId: string, date: Date | string): Promise<Booking[]> {
    const target = new Date(date);
    if (isNaN(target.getTime())) {
      throw new Error("Invalid date provided for agenda");
    }

    const dayStart = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
      0,
      0,
      0,
      0
    );
    const dayEnd = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
      23,
      59,
      59,
      999
    );

    const [userRecord, bookings] = await Promise.all([
      UserService.getUserById(userId),
      db
        .select()
        .from(booking)
        .where(
          and(
            ne(booking.status, "cancelled"),
            gte(booking.startTime, dayStart),
            lte(booking.startTime, dayEnd)
          )
        )
        .orderBy(asc(booking.startTime)),
    ]);
    const userEmail = userRecord?.email?.toLowerCase();

    // Filter where user is organizer or in attendee list
    return bookings.filter((b) => {
      if (b.organizerUserId === userId) return true;
      if (userEmail && b.attendees) {
        return b.attendees.some((a) => a.email.toLowerCase() === userEmail);
      }
      return false;
    });
  }

  /**
   * Lookup a booking by ID.
   */
  public static async getBookingById(id: string): Promise<Booking | null> {
    const results = await db.select().from(booking).where(eq(booking.id, id)).limit(1);
    return results[0] || null;
  }
}
