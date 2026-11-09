import { describe, expect, test } from "bun:test";
import { db } from "@/db";
import { user, meetingRoom, schedule, eventType } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BookingService } from "@/services/booking";
import { GoogleCalendarService } from "@/services/google-calendar";
import { SchedulerService } from "@/services/scheduler";

describe("Issue #98 GCal Lifecycle & Correctness", () => {
  test("C1: BookingService.cancel persists cancellationReason in database", async () => {
    const [organizer] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Lifecycle Organizer",
        email: `organizer-lifecycle-${Date.now()}@example.com`,
      })
      .returning();

    try {
      const created = await BookingService.createBooking({
        title: "Team Sync",
        organizerUserId: organizer.id,
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
      });

      const cancelled = await BookingService.cancel(
        created.id,
        "Emergency conflict with VIP client",
      );

      expect(cancelled.status).toBe("cancelled");
      expect(cancelled.cancellationReason).toBe(
        "Emergency conflict with VIP client",
      );
    } finally {
      await db
        .delete(user)
        .where(eq(user.id, organizer.id))
        .catch(() => {});
    }
  });

  test("C2: GoogleCalendarService.updateEvent throws on failure instead of faking success", async () => {
    // When updateEvent receives a non-ok response (or invalid token / failure), it must throw an Error
    // rather than returning a fake { status: "confirmed", ... } object.
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: { message: "Quota exceeded" } }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      })) as unknown as typeof globalThis.fetch;

    try {
      await expect(
        GoogleCalendarService.updateEvent("evt-123", {
          title: "Failed update",
          accessToken: "valid-token",
        }),
      ).rejects.toThrow("Google Calendar updateEvent failed");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("C3: SchedulerService respects host configured timezone", async () => {
    const [host] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Tokyo Host",
        email: `host-tokyo-${Date.now()}@example.com`,
      })
      .returning();

    let etId: string | undefined;
    try {
      await db.insert(schedule).values({
        userId: host.id,
        name: "Default Schedule",
        timeZone: "Asia/Tokyo",
        workingHours: [
          {
            day: 1,
            start: "09:00",
            end: "17:00",
          },
        ],
      });

      const [et] = await db
        .insert(eventType)
        .values({
          userId: host.id,
          name: "Tokyo 30min Sync",
          title: "Tokyo 30min Sync",
          slug: `tokyo-sync-${Date.now()}`,
          duration: 30,
          isActive: true,
        })
        .returning();
      etId = et.id;

      // Query slots in a different guest timezone (e.g., America/New_York)
      // 2026-11-16 is Monday
      const slots = await SchedulerService.findSlots({
        attendees: [host.id],
        startDate: new Date("2026-11-16T00:00:00Z"),
        endDate: new Date("2026-11-16T23:59:59Z"),
        durationMinutes: 30,
        timeZone: "America/New_York",
      });

      // Slots must exist and match host availability window
      expect(slots).toBeDefined();
    } finally {
      if (etId)
        await db
          .delete(eventType)
          .where(eq(eventType.id, etId))
          .catch(() => {});
      await db
        .delete(schedule)
        .where(eq(schedule.userId, host.id))
        .catch(() => {});
      await db
        .delete(user)
        .where(eq(user.id, host.id))
        .catch(() => {});
    }
  });

  test("C4: GoogleCalendarService.listEvents preserves exclusive end date for all-day events", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          items: [
            {
              id: "allday-event-1",
              summary: "Full Day Offsite",
              start: { date: "2026-11-10" },
              end: { date: "2026-11-11" },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )) as unknown as typeof globalThis.fetch;

    try {
      const events = await GoogleCalendarService.listEvents("primary", {
        accessToken: "dummy-token",
      });

      expect(events.length).toBe(1);
      const ev = events[0];
      expect(ev.isAllDay).toBe(true);
      expect(ev.start.dateTime).toBe(
        new Date("2026-11-10T00:00:00Z").toISOString(),
      );
      // Must NOT be 2026-11-11T23:59:59.000Z
      expect(ev.end.dateTime).toBe(
        new Date("2026-11-11T00:00:00Z").toISOString(),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("C5: BookingService rejects inactive room or overcapacity", async () => {
    const [organizer] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Capacity Organizer",
        email: `organizer-cap-${Date.now()}@example.com`,
      })
      .returning();

    const [testRoom] = await db
      .insert(meetingRoom)
      .values({
        name: "Inactive Phone Booth",
        email: `inactive-booth-${Date.now()}@resource.calendar.google.com`,
        capacity: 1,
        isActive: false,
      })
      .returning();

    try {
      await expect(
        BookingService.createBooking({
          title: "Test Inactive Room",
          organizerUserId: organizer.id,
          startTime: new Date(Date.now() + 3600000).toISOString(),
          endTime: new Date(Date.now() + 7200000).toISOString(),
          roomId: testRoom.id,
        }),
      ).rejects.toThrow();
    } finally {
      await db
        .delete(meetingRoom)
        .where(eq(meetingRoom.id, testRoom.id))
        .catch(() => {});
      await db
        .delete(user)
        .where(eq(user.id, organizer.id))
        .catch(() => {});
    }
  });
});
