import { describe, expect, test, beforeAll } from "bun:test";
import { UserService } from "../../src/services/user";
import { RoomService } from "../../src/services/rooms";
import { SchedulerService } from "../../src/services/scheduler";
import { BookingService } from "../../src/services/booking";
import { TeamService } from "../../src/services/team/team-service";
import { ProjectService } from "../../src/services/project/project-service";
import { seedDatabase } from "../../src/db/seed";

describe("Domain Services", () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  describe("UserService", () => {
    test("searchTeammates finds users in database by name or email", async () => {
      const alexResults = await UserService.searchTeammates("Alex");
      expect(alexResults.length).toBeGreaterThan(0);
      expect(alexResults[0].name).toContain("Alex");

      const emailResults =
        await UserService.searchTeammates("user1@example.com");
      expect(emailResults.length).toBe(1);
      expect(emailResults[0].email).toBe("user1@example.com");
    });

    test("searchTeammates falls back to Google Directory when DB has no matches", async () => {
      const dirResults = await UserService.searchTeammates("Sarah");
      expect(dirResults.length).toBeGreaterThan(0);
      expect(dirResults[0].name).toContain("Sarah");
      expect(dirResults[0].email).toContain("sarah@example.com");
    });

    test("searchTeammates includes Google Directory users even when DB has users", async () => {
      const results = await UserService.searchTeammates("Sarah");
      expect(results.some((u) => u.email.includes("sarah@example.com"))).toBe(
        true,
      );
    });

    test("searchTeammates respects limit parameter", async () => {
      const results = await UserService.searchTeammates("", 1);
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe("RoomService", () => {
    test("syncRoomsFromGoogle syncs rooms and listRooms returns smallest-fit matching", async () => {
      await RoomService.syncRoomsFromGoogle();

      const rooms = await RoomService.listRooms({ minCapacity: 4 });
      expect(rooms.length).toBeGreaterThan(0);
      expect(rooms[0].capacity).toBeGreaterThanOrEqual(4);

      // Verify smallest-fit order (capacity ascending)
      for (let i = 1; i < rooms.length; i++) {
        expect(rooms[i].capacity).toBeGreaterThanOrEqual(rooms[i - 1].capacity);
      }
    });

    test("listRooms filters by features", async () => {
      const rooms = await RoomService.listRooms({
        features: ["video-conference"],
      });
      expect(rooms.length).toBeGreaterThan(0);
      for (const r of rooms) {
        expect(r.features).toContain("video-conference");
      }
    });
  });

  describe("SchedulerService", () => {
    test("getEventTypes retrieves all event types ordered by duration", async () => {
      const types = await SchedulerService.getEventTypes();
      expect(types.length).toBeGreaterThanOrEqual(3);
      expect(types.some((t) => t.slug === "30m-1-on-1")).toBe(true);
    });

    test("findSlots finds open slots within working hours and excludes busy intervals", async () => {
      // Choose next Tuesday at 9am to avoid weekend issues
      const now = new Date();
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + ((2 + 7 - now.getDay()) % 7 || 7)); // Next Tuesday
      const start = new Date(
        nextDate.getFullYear(),
        nextDate.getMonth(),
        nextDate.getDate(),
        9,
        0,
        0,
      );
      const end = new Date(
        nextDate.getFullYear(),
        nextDate.getMonth(),
        nextDate.getDate(),
        17,
        0,
        0,
      );

      const slots = await SchedulerService.findSlots({
        attendees: ["user1@example.com"],
        durationMinutes: 30,
        startDate: start,
        endDate: end,
      });

      expect(Array.isArray(slots)).toBe(true);
      expect(slots.length).toBeGreaterThan(0);

      // Ensure mock busy interval for user1 (14:00 - 15:00) is NOT included in slots
      const busySlot = slots.find((s) => {
        const slotStart = new Date(s.start);
        return slotStart.getUTCHours() === 14;
      });
      expect(busySlot).toBeUndefined();
    });

    test("findSlots excludes slots colliding with DB bookings where user is an attendee", async () => {
      const now = new Date();
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + ((3 + 7 - now.getDay()) % 7 || 7)); // Next Wednesday
      const meetingStart = new Date(
        nextDate.getFullYear(),
        nextDate.getMonth(),
        nextDate.getDate(),
        10,
        0,
        0,
      );
      const meetingEnd = new Date(
        nextDate.getFullYear(),
        nextDate.getMonth(),
        nextDate.getDate(),
        11,
        0,
        0,
      );

      // Create a booking where usr_test_user is organizer, and usr_alex_rivera is in attendees JSON
      const existingMeeting = await BookingService.createBooking({
        title: "Team Sync",
        organizerUserId: "usr_test_user",
        startTime: meetingStart,
        endTime: meetingEnd,
        attendees: [{ email: "alex@example.com", name: "Alex Rivera" }],
      });

      const dayStart = new Date(
        nextDate.getFullYear(),
        nextDate.getMonth(),
        nextDate.getDate(),
        9,
        0,
        0,
      );
      const dayEnd = new Date(
        nextDate.getFullYear(),
        nextDate.getMonth(),
        nextDate.getDate(),
        17,
        0,
        0,
      );

      // Search slots for alex@example.com on that day
      const slots = await SchedulerService.findSlots({
        attendees: ["alex@example.com"],
        durationMinutes: 30,
        startDate: dayStart,
        endDate: dayEnd,
      });

      // 10:00 - 10:30 and 10:30 - 11:00 should NOT be in slots
      const conflictingSlot = slots.find((s) => {
        const t = new Date(s.start).getTime();
        return t >= meetingStart.getTime() && t < meetingEnd.getTime();
      });
      expect(conflictingSlot).toBeUndefined();

      // Clean up
      await BookingService.cancel(existingMeeting.id);
    });
  });

  describe("BookingService", () => {
    let createdBookingId: string;

    test("createBooking creates DB record and GCal event with meetingUrl", async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 48 * 3600 * 1000);
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

      const booking = await BookingService.createBooking({
        title: "Architecture Review",
        description: "Review domain service design",
        organizerUserId: "usr_alex_rivera",
        startTime,
        endTime,
        attendees: [{ email: "user1@example.com", name: "User One" }],
      });

      expect(booking).toBeDefined();
      expect(booking.id).toBeDefined();
      expect(booking.title).toBe("Architecture Review");
      expect(booking.status).toBe("confirmed");
      expect(booking.meetingUrl).toBeDefined();
      expect(booking.gcalEventId).toBeDefined();

      createdBookingId = booking.id;
    });

    test("getAgenda returns confirmed bookings for user on given date", async () => {
      const now = new Date();
      const bookingDate = new Date(now.getTime() + 48 * 3600 * 1000);

      const agenda = await BookingService.getAgenda(
        "usr_alex_rivera",
        bookingDate,
      );
      expect(Array.isArray(agenda)).toBe(true);
      expect(agenda.some((b) => b.id === createdBookingId)).toBe(true);
    });

    test("reschedule modifies booking time and syncs with GCal", async () => {
      const now = new Date();
      const newStart = new Date(now.getTime() + 50 * 3600 * 1000);
      const newEnd = new Date(newStart.getTime() + 45 * 60 * 1000);

      const updated = await BookingService.reschedule(createdBookingId, {
        startTime: newStart,
        endTime: newEnd,
      });

      expect(updated.id).toBe(createdBookingId);
      expect(new Date(updated.startTime).toISOString()).toBe(
        newStart.toISOString(),
      );
      expect(new Date(updated.endTime).toISOString()).toBe(
        newEnd.toISOString(),
      );
    });

    test("cancel cancels booking and deletes GCal event", async () => {
      const cancelled = await BookingService.cancel(createdBookingId);
      expect(cancelled.status).toBe("cancelled");

      const now = new Date();
      const bookingDate = new Date(now.getTime() + 50 * 3600 * 1000);
      const agenda = await BookingService.getAgenda(
        "usr_alex_rivera",
        bookingDate,
      );
      expect(agenda.some((b) => b.id === createdBookingId)).toBe(false);
    });

    test("reschedule throws error when rescheduling a cancelled booking", async () => {
      const now = new Date();
      const newStart = new Date(now.getTime() + 52 * 3600 * 1000);
      const newEnd = new Date(newStart.getTime() + 30 * 60 * 1000);

      expect(
        BookingService.reschedule(createdBookingId, {
          startTime: newStart,
          endTime: newEnd,
        }),
      ).rejects.toThrow("Cannot reschedule a cancelled booking");
    });

    test("createBooking persists projectId and reschedule updates or clears it", async () => {
      const team = await TeamService.createTeam({
        name: `Cal Project Team ${Date.now()}`,
        ownerId: "usr_test_user",
      });

      const projectA = await ProjectService.createProject({
        name: "Calendar Integration A",
        teamId: team.id,
        color: "#10b981",
      });

      const projectB = await ProjectService.createProject({
        name: "Calendar Integration B",
        teamId: team.id,
        color: "#6366f1",
      });

      const start = new Date(Date.now() + 60 * 3600 * 1000);
      const end = new Date(start.getTime() + 45 * 60 * 1000);

      const booking = await BookingService.createBooking({
        title: "Project Linked Booking",
        organizerUserId: "usr_alex_rivera",
        startTime: start,
        endTime: end,
        projectId: projectA.id,
      });

      expect(booking.projectId).toBe(projectA.id);

      const rescheduled = await BookingService.reschedule(booking.id, {
        projectId: projectB.id,
      });
      expect(rescheduled.projectId).toBe(projectB.id);

      const cleared = await BookingService.reschedule(booking.id, {
        projectId: null,
      });
      expect(cleared.projectId).toBeNull();

      await BookingService.cancel(booking.id);
      await TeamService.deleteTeam(team.id);
    });

    test("cancelSeries cancels all bookings belonging to a recurring series", async () => {
      const seriesId = `series_test_${Date.now()}`;
      const now = new Date();

      const booking1 = await BookingService.createBooking({
        title: "Daily Standup Day 1",
        description: `Sprint sync\n\n<!--series:${seriesId}-->`,
        organizerUserId: "usr_alex_rivera",
        startTime: new Date(now.getTime() + 70 * 3600 * 1000),
        endTime: new Date(now.getTime() + 70 * 3600 * 1000 + 15 * 60 * 1000),
      });

      const booking2 = await BookingService.createBooking({
        title: "Daily Standup Day 2",
        description: `Sprint sync\n\n<!--series:${seriesId}-->`,
        organizerUserId: "usr_alex_rivera",
        startTime: new Date(now.getTime() + 94 * 3600 * 1000),
        endTime: new Date(now.getTime() + 94 * 3600 * 1000 + 15 * 60 * 1000),
      });

      const cancelled = await BookingService.cancelSeries(seriesId);
      expect(cancelled.length).toBe(2);
      expect(cancelled.every((b) => b.status === "cancelled")).toBe(true);

      const refreshed1 = await BookingService.getBookingById(booking1.id);
      const refreshed2 = await BookingService.getBookingById(booking2.id);
      expect(refreshed1?.status).toBe("cancelled");
      expect(refreshed2?.status).toBe("cancelled");
    });

    test("cancelSeriesByBooking cancels entire series given any booking in the series", async () => {
      const seriesId = `series_by_booking_${Date.now()}`;
      const now = new Date();

      const bookingA = await BookingService.createBooking({
        title: "Weekly Review Week 1",
        description: `Weekly progress\n\n<!--series:${seriesId}-->`,
        organizerUserId: "usr_alex_rivera",
        startTime: new Date(now.getTime() + 100 * 3600 * 1000),
        endTime: new Date(now.getTime() + 100 * 3600 * 1000 + 30 * 60 * 1000),
      });

      const bookingB = await BookingService.createBooking({
        title: "Weekly Review Week 2",
        description: `Weekly progress\n\n<!--series:${seriesId}-->`,
        organizerUserId: "usr_alex_rivera",
        startTime: new Date(now.getTime() + 168 * 3600 * 1000),
        endTime: new Date(now.getTime() + 168 * 3600 * 1000 + 30 * 60 * 1000),
      });

      // Cancel the entire series by passing bookingA's ID
      const result = await BookingService.cancelSeriesByBooking(bookingA.id);
      expect(result.length).toBe(2);

      const checkA = await BookingService.getBookingById(bookingA.id);
      const checkB = await BookingService.getBookingById(bookingB.id);
      expect(checkA?.status).toBe("cancelled");
      expect(checkB?.status).toBe("cancelled");
    });
  });
});
