import { randomBytes } from "node:crypto";
import { db } from "@/db";
import {
  meetingInvite,
  user,
  meetingRoom,
  booking,
  type Booking,
  type MeetingInvite,
} from "@/db/schema";
import { eq, desc, inArray, and, lt, gt, or, sql } from "drizzle-orm";
import type { TimeSlot } from "./scheduler";
import { BookingService } from "./booking";
import { GoogleCalendarService } from "./google-calendar";
import {
  type CreateMeetingInviteInput,
  type BookMeetingInviteInput,
  type InviteDetails,
  MeetingInviteError,
  toPublicInviteDetails,
} from "./meeting-invite/meeting-invite-types";

import {
  findInviteSlots,
  getAvailableSlotsForInvite,
} from "./meeting-invite/meeting-invite-slots";

export type { CreateMeetingInviteInput, BookMeetingInviteInput, InviteDetails };
export { toPublicInviteDetails, MeetingInviteError };

export class MeetingInviteService {
  /**
   * Generate a human-readable clean URL slug
   */
  public static generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30);
    const randomSuffix = randomBytes(4).toString("hex");
    return `${base || "meet"}-${randomSuffix}`;
  }

  public static async createInvite(
    input: CreateMeetingInviteInput,
  ): Promise<MeetingInvite> {
    const slug = this.generateSlug(input.title);
    const [created] = await db
      .insert(meetingInvite)
      .values({
        slug,
        title: input.title.trim(),
        description: input.description?.trim(),
        duration: input.duration || 30,
        organizerUserId: input.organizerUserId,
        memberEmails: input.memberEmails.map((e) => e.trim().toLowerCase()),
        locationType: input.locationType || (input.roomId ? "room" : "meet"),
        roomId: input.roomId || null,
        isRestricted: Boolean(input.isRestricted),
        allowedEmails: (input.allowedEmails || []).map((e) =>
          e.trim().toLowerCase(),
        ),
        isActive: true,
      })
      .returning();

    return created;
  }

  public static async getInviteBySlug(slug: string) {
    const invites = await db
      .select()
      .from(meetingInvite)
      .where(eq(meetingInvite.slug, slug))
      .limit(1);

    if (invites.length === 0) return null;
    const inv = invites[0];

    const lowerMemberEmails = Array.from(
      new Set(inv.memberEmails.map((email) => email.toLowerCase())),
    );

    // Fetch organizer, room, and member user records in parallel
    const [organizers, rooms, matchedUsers] = await Promise.all([
      db.select().from(user).where(eq(user.id, inv.organizerUserId)).limit(1),
      inv.roomId
        ? db
            .select()
            .from(meetingRoom)
            .where(eq(meetingRoom.id, inv.roomId))
            .limit(1)
        : Promise.resolve([]),
      lowerMemberEmails.length > 0
        ? db.select().from(user).where(inArray(user.email, lowerMemberEmails))
        : Promise.resolve([]),
    ]);

    const organizer = organizers[0] || null;
    const room = rooms[0] || null;
    const userByEmail = new Map(
      matchedUsers.map((u) => [u.email.toLowerCase(), u]),
    );

    const members = inv.memberEmails.map((email) => {
      const u = userByEmail.get(email.toLowerCase());
      return u
        ? { id: u.id, name: u.name, email: u.email, image: u.image }
        : { id: email, name: email.split("@")[0], email, image: null };
    });

    const organizerProfile = organizer
      ? {
          id: organizer.id,
          name: organizer.name,
          email: organizer.email,
          image: organizer.image,
        }
      : null;

    return { invite: inv, organizer: organizerProfile, room, members };
  }

  public static async listInvitesByOrganizer(organizerUserId: string) {
    return db
      .select()
      .from(meetingInvite)
      .where(eq(meetingInvite.organizerUserId, organizerUserId))
      .orderBy(desc(meetingInvite.createdAt));
  }

  public static async getAvailableSlots(
    slug: string,
    dateStr: string,
    timeZone = "Asia/Ho_Chi_Minh",
  ): Promise<TimeSlot[]> {
    const details = await this.getInviteBySlug(slug);
    if (!details || !details.invite.isActive) {
      throw new MeetingInviteError("Meeting invite not found or inactive", 404);
    }
    return getAvailableSlotsForInvite(details, dateStr, timeZone);
  }

  public static async bookSlot(input: BookMeetingInviteInput) {
    const details = await this.getInviteBySlug(input.slug);
    if (!details || !details.invite.isActive) {
      throw new MeetingInviteError(
        "Meeting invite not found or no longer active",
        404,
      );
    }

    const { invite, organizer } = details;

    const startDate = new Date(input.startTime);
    const endDate = new Date(input.endTime);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new MeetingInviteError("Invalid start or end time format", 400);
    }
    if (startDate >= endDate) {
      throw new MeetingInviteError("Start time must be before end time", 400);
    }
    if (startDate.getTime() < Date.now()) {
      throw new MeetingInviteError("Meeting cannot be booked in the past", 400);
    }

    const durationMinutes =
      (endDate.getTime() - startDate.getTime()) / (60 * 1000);
    if (Math.round(durationMinutes) !== invite.duration) {
      throw new MeetingInviteError(
        `Requested booking duration (${durationMinutes}m) must match the invite duration (${invite.duration}m)`,
        400,
      );
    }

    if (
      invite.isRestricted &&
      invite.allowedEmails &&
      invite.allowedEmails.length > 0
    ) {
      const allowedSet = new Set(
        invite.allowedEmails.map((e) => e.toLowerCase()),
      );
      if (!allowedSet.has(input.guestEmail.trim().toLowerCase())) {
        throw new MeetingInviteError(
          "This meeting invitation is restricted to invited recipients only.",
          403,
        );
      }
    }

    const slotUnavailable = () =>
      new MeetingInviteError(
        "The selected time slot is no longer available.",
        409,
      );

    // Only accept a slot the invite actually offers (same computation as the slots endpoint).
    const offered = await findInviteSlots(details, startDate, endDate);
    const isOffered = offered.some(
      (s) =>
        new Date(s.start).getTime() === startDate.getTime() &&
        new Date(s.end).getTime() === endDate.getTime(),
    );
    if (!isOffered) throw slotUnavailable();

    const attendees = [
      ...(organizer?.email ? [{ email: organizer.email.toLowerCase() }] : []),
      ...invite.memberEmails.map((e) => ({ email: e.toLowerCase() })),
      {
        email: input.guestEmail.trim().toLowerCase(),
        name: input.guestName.trim(),
      },
    ];

    const description = [
      invite.description,
      input.notes ? `\n--- Guest Notes ---\n${input.notes.trim()}` : "",
      `\nBooked by: ${input.guestName} (${input.guestEmail})`,
      `Via collective scheduling link: /book/${invite.slug}`,
    ]
      .filter(Boolean)
      .join("\n");

    // Shareable links stay reusable: each booking must take a free offered slot,
    // and the conflict check + insert run under a per-organizer (and per-room)
    // lock so concurrent requests across invites cannot double-book.
    let createdBooking: Booking | undefined;
    let result: Booking;
    try {
      result = await db.transaction(async (tx) => {
        // Bound the wait: waiters hold a pool connection the lock holder may need.
        await tx.execute(sql`SET LOCAL lock_timeout = '10s'`);
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${`organizer:${invite.organizerUserId}`}))`,
        );
        if (invite.roomId) {
          await tx.execute(
            sql`SELECT pg_advisory_xact_lock(hashtext(${`room:${invite.roomId}`}))`,
          );
        }

        const conflicts = await tx
          .select({ id: booking.id })
          .from(booking)
          .where(
            and(
              eq(booking.status, "confirmed"),
              lt(booking.startTime, endDate),
              gt(booking.endTime, startDate),
              or(
                eq(booking.organizerUserId, invite.organizerUserId),
                eq(booking.userId, invite.organizerUserId),
                invite.roomId ? eq(booking.roomId, invite.roomId) : undefined,
              ),
            ),
          )
          .limit(1);
        if (conflicts.length > 0) throw slotUnavailable();

        createdBooking = await BookingService.createBooking(
          {
            title: `${invite.title} - ${input.guestName}`,
            description,
            organizerUserId: invite.organizerUserId,
            startTime: startDate,
            endTime: endDate,
            roomId: invite.roomId || undefined,
            attendees,
          },
          tx,
        );
        return createdBooking;
      });
    } catch (err) {
      // Booking row rolled back (e.g. commit failed): don't leave a live calendar event.
      if (createdBooking?.gcalEventId) {
        await GoogleCalendarService.deleteEvent(
          createdBooking.gcalEventId,
        ).catch(() => {});
      }
      const code =
        (err as { code?: string }).code ??
        (err as { cause?: { code?: string } }).cause?.code;
      if (code === "55P03") throw slotUnavailable(); // lock_timeout
      throw err;
    }

    // Public endpoint: confirmation fields only, never attendee or allow-list emails.
    return {
      booking: {
        id: result.id,
        title: result.title,
        startTime: result.startTime,
        endTime: result.endTime,
        meetingUrl: result.meetingUrl,
        status: result.status,
      },
      invite: toPublicInviteDetails(details).invite,
    };
  }
}
