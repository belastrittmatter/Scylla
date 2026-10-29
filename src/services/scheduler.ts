import { db } from "@/db";
import {
  eventType,
  schedule,
  user,
  booking,
  type EventType,
} from "@/db/schema";
import { asc, eq, and, gte, lte } from "drizzle-orm";
import { GoogleCalendarService } from "./google-calendar";
import { RoomService } from "./rooms";

export interface FindSlotsParams {
  attendees: string[]; // Email addresses or user IDs
  durationMinutes: number;
  startDate: Date | string;
  endDate: Date | string;
  eventTypeId?: string;
  roomId?: string;
  beforeBuffer?: number;
  afterBuffer?: number;
  timeZone?: string;
  accessToken?: string;
  prefetchedBusy?: Array<{ start: string | number; end: string | number }>;
}

export interface TimeSlot {
  start: string; // ISO 8601
  end: string; // ISO 8601
  available: boolean;
}

export interface WorkingHoursEntry {
  day: number;
  start: string;
  end: string;
}

const DEFAULT_WORKING_HOURS: WorkingHoursEntry[] = [
  { day: 1, start: "08:00", end: "18:00" }, // Mon
  { day: 2, start: "08:00", end: "18:00" }, // Tue
  { day: 3, start: "08:00", end: "18:00" }, // Wed
  { day: 4, start: "08:00", end: "18:00" }, // Thu
  { day: 5, start: "08:00", end: "18:00" }, // Fri
];

function getZonedParts(
  date: Date,
  timeZone?: string,
): { day: number; minutes: number } {
  if (!timeZone) {
    return {
      day: date.getDay(),
      minutes: date.getHours() * 60 + date.getMinutes(),
    };
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    });

    const parts = formatter.formatToParts(date);
    let weekdayStr = "";
    let hour = 0;
    let minute = 0;

    for (const p of parts) {
      if (p.type === "weekday") weekdayStr = p.value;
      if (p.type === "hour") hour = parseInt(p.value, 10);
      if (p.type === "minute") minute = parseInt(p.value, 10);
    }

    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    const day = weekdayMap[weekdayStr] ?? date.getDay();
    if (hour === 24) hour = 0;
    return { day, minutes: hour * 60 + minute };
  } catch {
    return {
      day: date.getDay(),
      minutes: date.getHours() * 60 + date.getMinutes(),
    };
  }
}

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export interface CreateEventTypeInput {
  userId?: string;
  name: string;
  title?: string;
  slug?: string;
  description?: string;
  duration: number;
  requiresRoom?: boolean;
  beforeBuffer?: number;
  afterBuffer?: number;
}

export class SchedulerService {
  /**
   * Retrieves all available event types ordered by duration.
   */
  public static async getEventTypes(userId?: string): Promise<EventType[]> {
    if (userId) {
      return db
        .select()
        .from(eventType)
        .where(eq(eventType.userId, userId))
        .orderBy(asc(eventType.duration), asc(eventType.name));
    }
    return db
      .select()
      .from(eventType)
      .orderBy(asc(eventType.duration), asc(eventType.name));
  }

  /**
   * Creates a new event type with a sanitized, unique slug.
   */
  public static async createEventType(
    input: CreateEventTypeInput,
  ): Promise<EventType> {
    const baseSlug = (input.slug || input.name || "meeting")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let finalSlug = baseSlug || "meeting";
    let counter = 1;
    while (true) {
      const existing = await this.getEventTypeBySlug(finalSlug);
      if (!existing) break;
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const [created] = await db
      .insert(eventType)
      .values({
        userId: input.userId,
        name: input.name,
        title: input.title || input.name,
        slug: finalSlug,
        description: input.description,
        duration: input.duration || 30,
        requiresRoom: input.requiresRoom ?? false,
        beforeBuffer: input.beforeBuffer ?? 0,
        afterBuffer: input.afterBuffer ?? 0,
      })
      .returning();

    return created;
  }

  /**
   * Lookup event type by slug.
   */
  public static async getEventTypeBySlug(
    slug: string,
  ): Promise<EventType | null> {
    const results = await db
      .select()
      .from(eventType)
      .where(eq(eventType.slug, slug))
      .limit(1);
    return results[0] || null;
  }

  /**
   * Lookup event type by ID.
   */
  public static async getEventTypeById(id: string): Promise<EventType | null> {
    const results = await db
      .select()
      .from(eventType)
      .where(eq(eventType.id, id))
      .limit(1);
    return results[0] || null;
  }

  /**
   * Calculates open time slots across attendees by:
   * 1. Intersecting user working hours from the `schedule` table.
   * 2. Querying Google Calendar Free/Busy intervals and DB confirmed bookings.
   * 3. Subtracting busy intervals and applying before/after buffer padding.
   */
  public static async findSlots(params: FindSlotsParams): Promise<TimeSlot[]> {
    let durationMinutes = params.durationMinutes;
    let beforeBuffer = params.beforeBuffer ?? 0;
    let afterBuffer = params.afterBuffer ?? 0;

    // If eventTypeId is provided, resolve default duration and buffers if not explicitly given
    if (params.eventTypeId) {
      const et = await this.getEventTypeById(params.eventTypeId);
      if (et) {
        if (!durationMinutes) durationMinutes = et.duration;
        if (params.beforeBuffer === undefined) beforeBuffer = et.beforeBuffer;
        if (params.afterBuffer === undefined) afterBuffer = et.afterBuffer;
      }
    }

    if (!durationMinutes || durationMinutes <= 0) {
      durationMinutes = 30;
    }

    const startWindow = new Date(params.startDate);
    const endWindow = new Date(params.endDate);

    if (startWindow >= endWindow) {
      return [];
    }

    // Resolve attendee emails and schedules in parallel
    const resolvedAttendeeInfo = await Promise.all(
      params.attendees.map(async (att) => {
        let resolvedEmail = att;
        let dbUser = null;

        if (att.includes("@")) {
          resolvedEmail = att.trim().toLowerCase();
          const users = await db
            .select()
            .from(user)
            .where(eq(user.email, resolvedEmail))
            .limit(1);
          dbUser = users[0] || null;
        } else {
          const users = await db
            .select()
            .from(user)
            .where(eq(user.id, att))
            .limit(1);
          if (users[0]) {
            dbUser = users[0];
            resolvedEmail = users[0].email;
          }
        }

        if (dbUser) {
          const scheds = await db
            .select()
            .from(schedule)
            .where(eq(schedule.userId, dbUser.id))
            .limit(1);

          if (scheds[0]) {
            return {
              email: resolvedEmail,
              userId: dbUser.id,
              schedule: {
                email: resolvedEmail,
                timeZone:
                  params.timeZone || scheds[0].timeZone || "Asia/Ho_Chi_Minh",
                workingHours: scheds[0].workingHours || DEFAULT_WORKING_HOURS,
              },
            };
          }
        }

        return {
          email: resolvedEmail,
          userId: dbUser?.id || null,
          schedule: {
            email: resolvedEmail,
            timeZone: params.timeZone || "Asia/Ho_Chi_Minh",
            workingHours: DEFAULT_WORKING_HOURS,
          },
        };
      }),
    );

    const attendeeEmails = resolvedAttendeeInfo.map((info) => info.email);
    const attendeeSchedules = resolvedAttendeeInfo.map((info) => info.schedule);
    const attendeeUserIds = resolvedAttendeeInfo
      .map((info) => info.userId)
      .filter((id): id is string => Boolean(id));

    // Build consolidated busy intervals: [startMs, endMs]
    const busyIntervals: Array<{ start: number; end: number }> = [];

    if (params.prefetchedBusy) {
      for (const inv of params.prefetchedBusy) {
        const bStart =
          typeof inv.start === "number"
            ? inv.start
            : new Date(inv.start).getTime();
        const bEnd =
          typeof inv.end === "number" ? inv.end : new Date(inv.end).getTime();
        if (bEnd > bStart) {
          busyIntervals.push({ start: bStart, end: bEnd });
        }
      }
    } else {
      // Resolve room email if roomId provided
      let roomEmail: string | undefined;
      if (params.roomId) {
        const room = await RoomService.getRoomById(params.roomId);
        if (room) {
          roomEmail = room.email;
        }
      }

      // Fetch Google Calendar busy intervals and DB confirmed bookings in parallel
      const calendarQueryEmails = [...attendeeEmails];
      if (roomEmail && !calendarQueryEmails.includes(roomEmail)) {
        calendarQueryEmails.push(roomEmail);
      }

      const [gcalFreeBusy, existingBookings] = await Promise.all([
        GoogleCalendarService.getFreeBusy(
          calendarQueryEmails,
          startWindow,
          endWindow,
          params.accessToken ? { accessToken: params.accessToken } : undefined,
        ),
        db
          .select()
          .from(booking)
          .where(
            and(
              eq(booking.status, "confirmed"),
              gte(booking.endTime, startWindow),
              lte(booking.startTime, endWindow),
            ),
          ),
      ]);

      for (const email of calendarQueryEmails) {
        const intervals = gcalFreeBusy[email] || [];
        for (const inv of intervals) {
          const bStart = new Date(inv.start).getTime();
          const bEnd = new Date(inv.end).getTime();
          if (bEnd > bStart) {
            busyIntervals.push({ start: bStart, end: bEnd });
          }
        }
      }

      for (const b of existingBookings) {
        const isRoomConflict = Boolean(
          params.roomId && b.roomId === params.roomId,
        );
        const isOrganizerConflict = attendeeUserIds.includes(b.organizerUserId);
        const isAttendeeConflict = (b.attendees || []).some((att) =>
          attendeeEmails.includes(att.email.toLowerCase()),
        );

        if (isRoomConflict || isOrganizerConflict || isAttendeeConflict) {
          const bStart = b.startTime.getTime();
          const bEnd = b.endTime.getTime();
          if (bEnd > bStart) {
            busyIntervals.push({ start: bStart, end: bEnd });
          }
        }
      }
    }

    // Step configuration (15m increments so slots starting at :15 / :45 after meetings are captured)
    const stepMinutes = 15;
    const stepMs = stepMinutes * 60 * 1000;
    const durationMs = durationMinutes * 60 * 1000;
    const beforeBufferMs = beforeBuffer * 60 * 1000;
    const afterBufferMs = afterBuffer * 60 * 1000;

    const availableSlots: TimeSlot[] = [];

    // Align start to the nearest step increment
    let currentMs = Math.ceil(startWindow.getTime() / stepMs) * stepMs;
    const endWindowMs = endWindow.getTime();

    while (currentMs + durationMs <= endWindowMs) {
      const slotStart = new Date(currentMs);
      const slotEnd = new Date(currentMs + durationMs);

      // 1. Check working hours for all attendees
      let withinWorkingHours = true;

      for (const sched of attendeeSchedules) {
        const startZoned = getZonedParts(slotStart, sched.timeZone);
        const endZoned = getZonedParts(slotEnd, sched.timeZone);

        // Find working hours entry for this day
        const dayWorkingHours = sched.workingHours.find(
          (wh) => wh.day === startZoned.day,
        );

        if (!dayWorkingHours) {
          withinWorkingHours = false;
          break;
        }

        const openMinutes = parseTimeToMinutes(dayWorkingHours.start);
        const closeMinutes = parseTimeToMinutes(dayWorkingHours.end);

        // Slot must begin and end within working hours on that day
        if (
          startZoned.minutes < openMinutes ||
          endZoned.minutes > closeMinutes ||
          startZoned.day !== endZoned.day
        ) {
          withinWorkingHours = false;
          break;
        }
      }

      if (withinWorkingHours) {
        // 2. Check collision with busy intervals (including before/after buffer padding)
        const paddedStartMs = currentMs - beforeBufferMs;
        const paddedEndMs = currentMs + durationMs + afterBufferMs;

        const hasCollision = busyIntervals.some(
          (inv) => paddedStartMs < inv.end && paddedEndMs > inv.start,
        );

        if (!hasCollision) {
          availableSlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            available: true,
          });
        }
      }

      currentMs += stepMs;
    }

    return availableSlots;
  }

  /**
   * Retrieves the configured working hours schedule for a user by id or email.
   * Defaults to Monday-Friday 08:00 - 18:00 if no custom schedule exists.
   */
  public static async getUserSchedule(userIdOrEmail?: string): Promise<{
    workingHours: WorkingHoursEntry[];
    timeZone: string;
  }> {
    if (!userIdOrEmail) {
      return {
        workingHours: DEFAULT_WORKING_HOURS,
        timeZone: "Asia/Ho_Chi_Minh",
      };
    }

    let targetUserId = userIdOrEmail;
    if (userIdOrEmail.includes("@")) {
      const users = await db
        .select()
        .from(user)
        .where(eq(user.email, userIdOrEmail.trim().toLowerCase()))
        .limit(1);
      if (users[0]) {
        targetUserId = users[0].id;
      }
    }

    const scheds = await db
      .select()
      .from(schedule)
      .where(eq(schedule.userId, targetUserId))
      .limit(1);

    if (scheds[0]) {
      return {
        workingHours: scheds[0].workingHours || DEFAULT_WORKING_HOURS,
        timeZone: scheds[0].timeZone || "Asia/Ho_Chi_Minh",
      };
    }

    return {
      workingHours: DEFAULT_WORKING_HOURS,
      timeZone: "Asia/Ho_Chi_Minh",
    };
  }
}
