import { db } from "@/db";
import { booking, type Booking } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GoogleCalendarService } from "./google-calendar";
import { RoomService } from "./rooms";
import { getOrganizerToken } from "./booking/booking-token-helper";
import {
  BookingQueryService,
  type BookingAttendee,
} from "./booking/booking-query-service";
import { BookingSeriesService } from "./booking/booking-series-service";

export type { BookingAttendee };

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

function normalizeAttendees(
  attendees?: Array<string | BookingAttendee>,
): BookingAttendee[] {
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
  public static async createBooking(
    payload: CreateBookingPayload,
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
      organizerToken,
    );

    try {
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
    const targetDescription =
      payload.description !== undefined
        ? payload.description
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
  ): Promise<Booking[]> {
    return BookingSeriesService.cancelSeries(seriesId, reason);
  }

  public static async cancelSeriesByBooking(
    id: string,
    reason?: string,
  ): Promise<Booking[]> {
    return BookingSeriesService.cancelSeriesByBooking(
      id,
      (bookingId, r) => this.cancel(bookingId, r),
      reason,
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
}
