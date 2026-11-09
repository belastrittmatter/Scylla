import { db } from "@/db";
import { schedule, user, booking, type EventType } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { GoogleCalendarService } from "./google-calendar";
import { RoomService } from "./rooms";
import { UserScheduleService } from "./scheduler/user-schedule-service";
import {
  EventTypeService,
  type CreateEventTypeInput,
} from "./scheduler/event-type-service";
import {
  DEFAULT_WORKING_HOURS,
  getZonedParts,
  parseTimeToMinutes,
  type FindSlotsParams,
  type TimeSlot,
  type WorkingHoursEntry,
} from "./scheduler/scheduler-types";

export type {
  FindSlotsParams,
  TimeSlot,
  WorkingHoursEntry,
  CreateEventTypeInput,
};

export class SchedulerService {
  public static async getEventTypes(userId?: string): Promise<EventType[]> {
    return EventTypeService.getEventTypes(userId);
  }

  public static async createEventType(
    input: CreateEventTypeInput,
  ): Promise<EventType> {
    return EventTypeService.createEventType(input);
  }

  public static async getEventTypeBySlug(
    slug: string,
  ): Promise<EventType | null> {
    return EventTypeService.getEventTypeBySlug(slug);
  }

  public static async getEventTypeById(id: string): Promise<EventType | null> {
    return EventTypeService.getEventTypeById(id);
  }

  public static async findSlots(params: FindSlotsParams): Promise<TimeSlot[]> {
    let durationMinutes = params.durationMinutes;
    let beforeBuffer = params.beforeBuffer ?? 0;
    let afterBuffer = params.afterBuffer ?? 0;

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

    if (isNaN(startWindow.getTime()) || isNaN(endWindow.getTime())) {
      throw new Error("Invalid startDate or endDate provided");
    }
    if (startWindow >= endWindow) {
      throw new Error("startDate must be before endDate");
    }

    const resolvedAttendeeInfo = await Promise.all(
      params.attendees.map(async (att) => {
        let resolvedEmail = att.trim().toLowerCase();
        let dbUser = null;

        if (att.includes("@")) {
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
                  scheds[0].timeZone || params.timeZone || "Asia/Ho_Chi_Minh",
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
      let roomEmail: string | undefined;
      if (params.roomId) {
        const room = await RoomService.getRoomById(params.roomId);
        if (room) {
          roomEmail = room.email;
        }
      }

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

    const stepMinutes = 15;
    const stepMs = stepMinutes * 60 * 1000;
    const durationMs = durationMinutes * 60 * 1000;
    const beforeBufferMs = beforeBuffer * 60 * 1000;
    const afterBufferMs = afterBuffer * 60 * 1000;

    const availableSlots: TimeSlot[] = [];
    let currentMs = Math.ceil(startWindow.getTime() / stepMs) * stepMs;
    const endWindowMs = endWindow.getTime();

    while (currentMs + durationMs <= endWindowMs) {
      const slotStart = new Date(currentMs);
      const slotEnd = new Date(currentMs + durationMs);
      let withinWorkingHours = true;

      for (const sched of attendeeSchedules) {
        const startZoned = getZonedParts(slotStart, sched.timeZone);
        const endZoned = getZonedParts(slotEnd, sched.timeZone);

        const dayWorkingHours = sched.workingHours.find(
          (wh) => wh.day === startZoned.day,
        );

        if (!dayWorkingHours) {
          withinWorkingHours = false;
          break;
        }

        const openMinutes = parseTimeToMinutes(dayWorkingHours.start);
        const closeMinutes = parseTimeToMinutes(dayWorkingHours.end);

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

  public static async getUserSchedule(userIdOrEmail?: string): Promise<{
    workingHours: WorkingHoursEntry[];
    timeZone: string;
  }> {
    return UserScheduleService.getUserSchedule(userIdOrEmail);
  }
}
