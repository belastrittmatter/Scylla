import { describe, expect, test, beforeAll } from "bun:test";
import {
  searchTeammatesAction,
  getRoomsAction,
  findSlotsAction,
  getAgendaAction,
  createBookingAction,
  rescheduleBookingAction,
  cancelBookingAction,
} from "../../src/actions";
import { db } from "../../src/db";
import { meetingRoom } from "../../src/db/schema";
import { seedDatabase } from "../../src/db/seed";

describe("Server Actions Layer", () => {
  beforeAll(async () => {
    await seedDatabase();
    const testRooms = [
      {
        name: "Room Alpha",
        email: "room-alpha@resource.calendar.google.com",
        capacity: 4,
        features: ["whiteboard", "video-conference"],
      },
      {
        name: "Room Beta",
        email: "room-beta@resource.calendar.google.com",
        capacity: 8,
        features: ["tv", "video-conference"],
      },
      {
        name: "Boardroom Delta",
        email: "room-delta@resource.calendar.google.com",
        capacity: 14,
        features: ["projector", "video-conference"],
      },
    ];
    for (const r of testRooms) {
      await db.insert(meetingRoom).values(r).onConflictDoNothing();
    }
  });

  describe("searchTeammatesAction", () => {
    test("returns list of teammates matching query", async () => {
      const result = await searchTeammatesAction("alex");
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
      expect(result.data![0].name).toContain("Alex");
    }, 15000);

    test("returns teammates when query is empty string", async () => {
      const result = await searchTeammatesAction("");
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
    });

    test("handles non-string query input gracefully", async () => {
      // @ts-expect-error testing invalid input
      const result = await searchTeammatesAction(12345);
      expect(result.success).toBe(false);
      expect(typeof result.error).toBe("string");
    });
  });

  describe("getRoomsAction", () => {
    test("returns list of rooms with empty filter", async () => {
      const result = await getRoomsAction({});
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThanOrEqual(3);
    });

    test("returns list of rooms without filter argument", async () => {
      const result = await getRoomsAction();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThanOrEqual(3);
    });

    test("filters rooms by minimum capacity", async () => {
      const result = await getRoomsAction({ minCapacity: 6 });
      expect(result.success).toBe(true);
      expect(result.data!.length).toBeGreaterThanOrEqual(2);
      expect(result.data!.every((r) => r.capacity >= 6)).toBe(true);
    });

    test("filters rooms by feature", async () => {
      const result = await getRoomsAction({ features: ["projector"] });
      expect(result.success).toBe(true);
      expect(result.data!.length).toBe(1);
      expect(result.data![0].name).toContain("Boardroom Delta");
    });

    test("returns error on invalid filter format", async () => {
      // @ts-expect-error testing invalid input
      const result = await getRoomsAction({ minCapacity: "invalid-number" });
      expect(result.success).toBe(false);
      expect(typeof result.error).toBe("string");
    });
  });

  describe("findSlotsAction", () => {
    test("finds available slots for valid parameters", async () => {
      const now = new Date();
      // Pick next Monday at 09:00 UTC
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
      nextMonday.setUTCHours(9, 0, 0, 0);

      const endWindow = new Date(nextMonday);
      endWindow.setUTCHours(12, 0, 0, 0);

      const result = await findSlotsAction({
        attendees: ["alex@example.com"],
        durationMinutes: 30,
        startDate: nextMonday.toISOString(),
        endDate: endWindow.toISOString(),
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
      expect(result.data![0]).toHaveProperty("start");
      expect(result.data![0]).toHaveProperty("end");
      expect(result.data![0].available).toBe(true);
    });

    test("returns error when startDate is after endDate", async () => {
      const result = await findSlotsAction({
        attendees: ["alex@example.com"],
        durationMinutes: 30,
        startDate: "2026-10-20T12:00:00Z",
        endDate: "2026-10-20T10:00:00Z",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("returns error when attendees array is empty", async () => {
      const result = await findSlotsAction({
        attendees: [],
        durationMinutes: 30,
        startDate: "2026-10-20T10:00:00Z",
        endDate: "2026-10-20T12:00:00Z",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("getAgendaAction", () => {
    test("returns user agenda for valid date and userId", async () => {
      const result = await getAgendaAction("2026-10-20", "usr_alex_rivera");
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    test("returns error when date format is invalid", async () => {
      const result = await getAgendaAction("not-a-valid-date", "usr_alex_rivera");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("returns error when userId is missing and no session present", async () => {
      const result = await getAgendaAction("2026-10-20");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("createBookingAction, rescheduleBookingAction, and cancelBookingAction lifecycle", () => {
    let createdBookingId: string;

    test("createBookingAction validates payload and creates booking", async () => {
      const result = await createBookingAction({
        title: "Architecture Strategy Meeting",
        description: "Review system architecture",
        organizerUserId: "usr_alex_rivera",
        startTime: "2026-10-20T10:00:00.000Z",
        endTime: "2026-10-20T10:45:00.000Z",
        attendees: ["test@example.com"],
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.title).toBe("Architecture Strategy Meeting");
      expect(result.data!.status).toBe("confirmed");
      expect(result.data!.meetingUrl).toBeDefined();
      expect(result.data!.id).toBeDefined();

      createdBookingId = result.data!.id;
    });

    test("createBookingAction returns error on missing required fields", async () => {
      // @ts-expect-error testing missing title
      const result = await createBookingAction({
        organizerUserId: "usr_alex_rivera",
        startTime: "2026-10-20T10:00:00.000Z",
        endTime: "2026-10-20T10:45:00.000Z",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("createBookingAction returns error when startTime >= endTime", async () => {
      const result = await createBookingAction({
        title: "Invalid Times Booking",
        organizerUserId: "usr_alex_rivera",
        startTime: "2026-10-20T11:00:00.000Z",
        endTime: "2026-10-20T10:00:00.000Z",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("getAgendaAction includes newly created booking for organizer and attendee", async () => {
      const agendaOrganizer = await getAgendaAction("2026-10-20", "usr_alex_rivera");
      expect(agendaOrganizer.success).toBe(true);
      expect(agendaOrganizer.data!.some((b) => b.id === createdBookingId)).toBe(true);

      const agendaAttendee = await getAgendaAction("2026-10-20", "usr_test_user");
      expect(agendaAttendee.success).toBe(true);
      expect(agendaAttendee.data!.some((b) => b.id === createdBookingId)).toBe(true);
    });

    test("rescheduleBookingAction updates booking time", async () => {
      const newStart = "2026-10-20T14:00:00.000Z";
      const newEnd = "2026-10-20T14:45:00.000Z";

      const result = await rescheduleBookingAction(createdBookingId, {
        startTime: newStart,
        endTime: newEnd,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(new Date(result.data!.startTime).toISOString()).toBe(newStart);
      expect(new Date(result.data!.endTime).toISOString()).toBe(newEnd);
    });

    test("rescheduleBookingAction returns error for non-existent booking", async () => {
      const result = await rescheduleBookingAction("non_existent_id", {
        startTime: "2026-10-20T14:00:00.000Z",
        endTime: "2026-10-20T14:45:00.000Z",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    test("cancelBookingAction cancels booking and updates status", async () => {
      const result = await cancelBookingAction(createdBookingId);
      expect(result.success).toBe(true);
      expect(result.data!.status).toBe("cancelled");
    });

    test("rescheduleBookingAction returns error when rescheduling cancelled booking", async () => {
      const result = await rescheduleBookingAction(createdBookingId, {
        startTime: "2026-10-20T15:00:00.000Z",
        endTime: "2026-10-20T15:45:00.000Z",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("cancelled");
    });

    test("cancelBookingAction returns error for non-existent booking", async () => {
      const result = await cancelBookingAction("non_existent_id");
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });
});
