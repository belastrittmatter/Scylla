import { db } from "@/db";
import { booking, type Booking } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GoogleCalendarService } from "./google-calendar";
import { RoomService } from "./rooms";
import {
  getOrganizerToken,
  normalizeAttendees,
  sanitizeBookingDescription,
} from "./booking/booking-token-helper";
import {
  BookingQueryService,
  type BookingAttendee,
} from "./booking/booking-query-service";
import { BookingSeriesService } from "./booking/booking-series-service";

export type { BookingAttendee };

export interface CreateBookingPayload {
  title: string;
  description?: string;
  seriesId?: string;
  sanitizeDescription?: boolean;
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

export class BookingService {
  /** The organizer's Google token; kept on the class for existing callers. */
  public static getOrganizerToken = getOrganizerToken;

  /**
   * Creates a new booking atomically:
   * 1. Creates a Google Calendar event with a Google Meet conference link.
   * 2. Inserts the booking record into PostgreSQL.
   * 3. Rolls back Google Calendar event if the database transaction fails.
   */
  public static async createBooking(
    payload: CreateBookingPayload,
    // Pass a transaction to make the insert part of the caller's conflict check.
    executor: Pick<typeof db, "insert"> = db,
  ): Promise<Booking> {
    const start = new Date(payload.startTime);
    const end = new Date(payload.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid start or end time");
    }
    if (start >= end) {
      throw new Error("startTime must be before endTime");
    }

    const normalized = normalizeAttendees(payload.attendees);

    const [room, organizerToken] = await Promise.all([
      payload.roomId
        ? RoomService.getRoomById(payload.roomId)
        : Promise.resolve(null),
      getOrganizerToken(payload.organizerUserId),
    ]);

    if (payload.roomId && !room) {
      throw new Error(`Room with ID ${payload.roomId} not found`);
    }

    if (room && !room.isActive) {
      throw new Error(`Room "${room.name}" is currently inactive`);
    }

    if (room && room.capacity && normalized.length > room.capacity) {
      throw new Error(
        `Room "${room.name}" capacity of ${room.capacity} exceeded by attendee count (${normalized.length})`,
      );
    }

    const roomEmail = room?.email;

    let finalDescription = payload.description;
    if (payload.seriesId) {
      const cleanDesc = sanitizeBookingDescription(payload.description);
      finalDescription = cleanDesc
        ? `${cleanDesc}\n\n<!--series:${payload.seriesId}-->`
        : `<!--series:${payload.seriesId}-->`;
    } else if (payload.sanitizeDescription) {
      finalDescription =
        sanitizeBookingDescription(payload.description) || undefined;
    }

    const gcalEvent = await GoogleCalendarService.createEvent(
      {
        title: payload.title,
        description: finalDescription,
        start,
        end,
        attendees: normalized.map((a) => ({
          email: a.email,
          name: a.name,
        })),
        roomEmail,
        conference: true,
      },
      organizerToken,
    );

    try {
      const [newBooking] = await executor
        .insert(booking)
        .values({
          title: payload.title,
          description: finalDescription,
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
      if (gcalEvent.id) {
        await GoogleCalendarService.deleteEvent(
          gcalEvent.id,
          "primary",
          organizerToken,
        ).catch(() => {});
      }
      throw err;
    }
  }

  public static async reschedule(
    id: string,
    payload: ReschedulePayload,
  ): Promise<Booking> {
    const existing = await this.getBookingById(id);
    if (!existing) {
      throw new Error(`Booking with ID ${id} not found`);
    }

    if (existing.status === "cancelled") {
      throw new Error("Cannot reschedule a cancelled booking");
    }

    const start = payload.startTime
      ? new Date(payload.startTime)
      : existing.startTime;
    const end = payload.endTime ? new Date(payload.endTime) : existing.endTime;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid start or end time");
    }
    if (start >= end) {
      throw new Error("startTime must be before endTime");
    }

    const targetRoomId =
      payload.roomId !== undefined ? payload.roomId : existing.roomId;
    let roomEmail: string | undefined;
    if (targetRoomId) {
      const room = await RoomService.getRoomById(targetRoomId);
      if (room) {
        roomEmail = room.email;
      }
    }

    const targetProjectId =
      payload.projectId !== undefined ? payload.projectId : existing.projectId;
    const targetTitle =
      payload.title !== undefined ? payload.title : existing.title;

    const cleanDesc =
      payload.description !== undefined
        ? sanitizeBookingDescription(payload.description)
        : undefined;
    const existingSeriesMatch = existing.description?.match(
      /<!--series:[a-zA-Z0-9_-]+-->/,
    );
    const targetDescription =
      payload.description !== undefined
        ? existingSeriesMatch
          ? cleanDesc
            ? `${cleanDesc}\n\n${existingSeriesMatch[0]}`
            : existingSeriesMatch[0]
          : cleanDesc || null
        : existing.description;

    const organizerToken = await getOrganizerToken(existing.organizerUserId);

    if (existing.gcalEventId) {
      await GoogleCalendarService.updateEvent(
        existing.gcalEventId,
        {
          start,
          end,
          roomEmail,
          title: targetTitle,
          description: targetDescription || undefined,
          attendees: existing.attendees,
        },
        organizerToken,
      );
    }

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

  public static async cancel(id: string, reason?: string): Promise<Booking> {
    const cleanId = id.replace(/^gcal-/, "");
    const existing = await this.getBookingById(id);
    if (!existing) {
      try {
        await GoogleCalendarService.deleteEvent(cleanId);
      } catch {}
      throw new Error(`Booking with ID ${id} not found`);
    }

    const organizerToken = await getOrganizerToken(existing.organizerUserId);

    if (existing.gcalEventId) {
      await GoogleCalendarService.deleteEvent(
        existing.gcalEventId,
        "primary",
        organizerToken,
      ).catch(() => {});
    }

    const [cancelled] = await db
      .update(booking)
      .set({
        status: "cancelled",
        cancellationReason: reason || null,
        updatedAt: new Date(),
      })
      .where(eq(booking.id, existing.id))
      .returning();

    return cancelled;
  }

  public static async cancelSeries(
    seriesId: string,
    reason?: string,
    ownerUserId?: string,
  ): Promise<Booking[]> {
    return BookingSeriesService.cancelSeries(seriesId, reason, ownerUserId);
  }

  public static async cancelSeriesByBooking(
    id: string,
    reasonOrCaller?: string,
    callerUserId?: string,
  ): Promise<Booking[]> {
    return BookingSeriesService.cancelSeriesByBooking(
      id,
      (bookingId, r) => this.cancel(bookingId, r),
      reasonOrCaller,
      callerUserId,
    );
  }

  public static async getBookingById(id: string): Promise<Booking | null> {
    return BookingQueryService.getBookingById(id);
  }

  public static async getAgenda(
    userId: string,
    date: Date | string,
  ): Promise<Booking[]> {
    return BookingQueryService.getAgenda(userId, date);
  }

  /**
   * Who may reschedule or cancel a booking: its organizer or calendar owner.
   * Attendees can see a booking on their agenda but never change it.
   * Shared by Server Actions and the REST route so both enforce one rule.
   */
  public static canModify(
    b: Pick<Booking, "organizerUserId" | "userId">,
    userId: string,
  ): boolean {
    return b.organizerUserId === userId || b.userId === userId;
  }
}
