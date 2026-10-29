import { db } from "@/db";
import {
  meetingInvite,
  user,
  meetingRoom,
  type MeetingInvite,
} from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { SchedulerService, type TimeSlot } from "./scheduler";
import { BookingService } from "./booking";

export interface CreateMeetingInviteInput {
  title: string;
  description?: string;
  duration?: number;
  organizerUserId: string;
  memberEmails: string[];
  locationType?: "meet" | "room";
  roomId?: string;
  isRestricted?: boolean;
  allowedEmails?: string[];
}

export interface BookMeetingInviteInput {
  slug: string;
  guestName: string;
  guestEmail: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  notes?: string;
}

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
    const randomSuffix = Math.random().toString(36).substring(2, 7);
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
      if (u) {
        return { id: u.id, name: u.name, email: u.email, image: u.image };
      }
      return { id: email, name: email.split("@")[0], email, image: null };
    });

    return {
      invite: inv,
      organizer: organizer
        ? {
            id: organizer.id,
            name: organizer.name,
            email: organizer.email,
            image: organizer.image,
          }
        : null,
      room,
      members,
    };
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
      throw new Error("Meeting invite not found or inactive");
    }

    const { invite, organizer } = details;
    const allAttendees = new Set<string>();
    if (organizer?.email) allAttendees.add(organizer.email.toLowerCase());
    for (const email of invite.memberEmails) {
      allAttendees.add(email.toLowerCase());
    }

    // Compute a search window around the requested date
    const baseDate = new Date(`${dateStr}T12:00:00.000Z`);
    const startDate = new Date(
      baseDate.getTime() - 24 * 3600 * 1000,
    ).toISOString();
    const endDate = new Date(
      baseDate.getTime() + 24 * 3600 * 1000,
    ).toISOString();

    const slots = await SchedulerService.findSlots({
      attendees: Array.from(allAttendees),
      durationMinutes: invite.duration,
      startDate,
      endDate,
      roomId: invite.roomId || undefined,
      timeZone,
    });

    const dateFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    // Return only available slots that match the requested date in the specified timeZone
    return slots.filter((s) => {
      if (!s.available) return false;
      const slotDate = dateFormatter.format(new Date(s.start));
      return slotDate === dateStr;
    });
  }

  public static async bookSlot(input: BookMeetingInviteInput) {
    const details = await this.getInviteBySlug(input.slug);
    if (!details || !details.invite.isActive) {
      throw new Error("Meeting invite not found or no longer active");
    }

    const { invite, organizer } = details;

    if (
      invite.isRestricted &&
      invite.allowedEmails &&
      invite.allowedEmails.length > 0
    ) {
      const allowedSet = new Set(
        invite.allowedEmails.map((e) => e.toLowerCase()),
      );
      if (!allowedSet.has(input.guestEmail.trim().toLowerCase())) {
        throw new Error(
          `This meeting invitation is restricted to invited recipients only: ${invite.allowedEmails.join(", ")}`,
        );
      }
    }

    const attendees = Array.from(
      new Set([
        ...(organizer?.email ? [organizer.email.toLowerCase()] : []),
        ...invite.memberEmails.map((e) => e.toLowerCase()),
        input.guestEmail.trim().toLowerCase(),
      ]),
    ).map((email) => ({
      email,
      name:
        email === input.guestEmail.toLowerCase()
          ? input.guestName.trim()
          : undefined,
    }));

    const description = [
      invite.description,
      input.notes ? `\n--- Guest Notes ---\n${input.notes.trim()}` : "",
      `\nBooked by: ${input.guestName} (${input.guestEmail})`,
      `Via collective scheduling link: /book/${invite.slug}`,
    ]
      .filter(Boolean)
      .join("\n");

    const createdBooking = await BookingService.createBooking({
      title: `${invite.title} - ${input.guestName}`,
      description,
      organizerUserId: invite.organizerUserId,
      startTime: input.startTime,
      endTime: input.endTime,
      roomId: invite.roomId || undefined,
      attendees,
    });

    // Link booking to invite
    await db
      .update(meetingInvite)
      .set({ bookingId: createdBooking.id })
      .where(eq(meetingInvite.id, invite.id));

    return {
      booking: createdBooking,
      invite,
    };
  }
}
