import { describe, expect, test, beforeAll } from "bun:test";
import { apiClient } from "@/lib/api-client";
import { seedDatabase } from "@/db/seed";

describe("Frontend API Client Mapping", () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  describe("apiClient.users.search", () => {
    test("fetches users via /api/users/search", async () => {
      const users = await apiClient.users.search("alex");
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      expect(users[0].name.toLowerCase()).toContain("alex");
    });
  });

  describe("apiClient.rooms.list and sync", () => {
    test("fetches rooms via /api/rooms", async () => {
      const rooms = await apiClient.rooms.list({ minCapacity: 2 });
      expect(Array.isArray(rooms)).toBe(true);
      expect(rooms.length).toBeGreaterThan(0);
      expect(rooms.every((r) => r.capacity >= 2)).toBe(true);
    });

    test("triggers room sync via /api/rooms/sync", async () => {
      try {
        const result = await apiClient.rooms.sync();
        expect(result.success).toBe(true);
        expect(Array.isArray(result.rooms)).toBe(true);
      } catch (err) {
        expect(err instanceof Error).toBe(true);
      }
    });
  });

  describe("apiClient.slots.find", () => {
    test("computes conflict-free slots via /api/slots/find", async () => {
      const slots = await apiClient.slots.find({
        attendees: ["alex@example.com"],
        durationMinutes: 30,
        startDate: "2026-10-19T08:00:00.000Z",
        endDate: "2026-10-19T18:00:00.000Z",
      });
      expect(Array.isArray(slots)).toBe(true);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].available).toBe(true);
    });
  });

  describe("apiClient.bookings lifecycle", () => {
    let bookingId: string;

    test("creates booking via /api/bookings", async () => {
      const newBooking = await apiClient.bookings.create({
        title: "Client-Mapped Engineering Sync",
        description: "Testing API client mapping from UI",
        organizerUserId: "usr_alex_rivera",
        startTime: "2026-10-22T09:00:00.000Z",
        endTime: "2026-10-22T10:00:00.000Z",
        attendees: ["alex@example.com"],
      });

      expect(newBooking).toBeDefined();
      expect(newBooking.id).toBeDefined();
      expect(newBooking.title).toBe("Client-Mapped Engineering Sync");
      bookingId = newBooking.id;
    });

    test("fetches user agenda via /api/bookings/agenda", async () => {
      const agenda = await apiClient.bookings.getAgenda({
        date: "2026-10-22T00:00:00.000Z",
        userId: "usr_alex_rivera",
      });
      expect(Array.isArray(agenda)).toBe(true);
      expect(agenda.some((b) => b.id === bookingId)).toBe(true);
    });

    test("reschedules booking via /api/bookings/[id]", async () => {
      const updated = await apiClient.bookings.reschedule(bookingId, {
        startTime: "2026-10-22T10:00:00.000Z",
        endTime: "2026-10-22T11:00:00.000Z",
      });
      expect(updated.id).toBe(bookingId);
      expect(new Date(updated.startTime).toISOString()).toBe(
        "2026-10-22T10:00:00.000Z",
      );
    });

    test("cancels booking via /api/bookings/[id]", async () => {
      const result = await apiClient.bookings.cancel(bookingId);
      expect(result).toBeDefined();
      expect(result.id).toBe(bookingId);
      expect(result.status).toBe("cancelled");
    });
  });

  describe("apiClient.eventTypes and template-based booking", () => {
    test("fetches all event types via /api/event-types", async () => {
      const types = await apiClient.eventTypes.list();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThanOrEqual(3);
      expect(types.some((t) => t.slug === "15m-quick-sync")).toBe(true);
      expect(types.some((t) => t.slug === "30m-1-on-1")).toBe(true);
      expect(types.some((t) => t.slug === "60m-team-sync-review")).toBe(true);
    });

    test("creates a booking using an event type template with foreign key eventTypeId", async () => {
      const types = await apiClient.eventTypes.list();
      const template = types.find((t) => t.slug === "30m-1-on-1") || types[0];

      const start = new Date(Date.now() + 72 * 3600 * 1000);
      const end = new Date(start.getTime() + template.duration * 60 * 1000);

      const templateBooking = await apiClient.bookings.create({
        title: `${template.name} with Engineering Team`,
        description: template.description || undefined,
        eventTypeId: template.id,
        organizerUserId: "usr_alex_rivera",
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        attendees: ["alex@example.com"],
      });

      expect(templateBooking).toBeDefined();
      expect(templateBooking.id).toBeDefined();
      expect(templateBooking.eventTypeId).toBe(template.id);
      expect(templateBooking.title).toContain(template.name);
      expect(templateBooking.meetingUrl).toBeDefined();
      expect(templateBooking.gcalEventId).toBeDefined();

      // Verify calendar deduplication: getEvents returns the unified event once, not duplicated
      const calendarRes = await apiClient.calendar.getEvents({
        userId: "usr_alex_rivera",
        timeMin: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        timeMax: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      });
      expect(calendarRes).toBeDefined();
      expect(Array.isArray(calendarRes.events)).toBe(true);

      const matchingEvents = calendarRes.events.filter(
        (ev) =>
          ev.id === templateBooking.id ||
          (templateBooking.gcalEventId &&
            ev.id === `gcal-${templateBooking.gcalEventId}`),
      );
      // Must appear exactly once, not twice
      expect(matchingEvents.length).toBe(1);
      expect(matchingEvents[0].id).toBe(templateBooking.id);
      expect(matchingEvents[0].meetingUrl).toBeDefined();

      // Clean up
      await apiClient.bookings.cancel(templateBooking.id);
    });
  });

  describe("apiClient.calendar.getEvents", () => {
    test("respects an aborted AbortSignal", async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        apiClient.calendar.getEvents(
          {
            userId: "usr_alex_rivera",
          },
          { signal: controller.signal },
        ),
      ).rejects.toThrow();
    });
  });
});
