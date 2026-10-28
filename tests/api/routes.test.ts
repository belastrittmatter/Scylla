import { describe, expect, test, beforeAll } from "bun:test";
import { GET as searchUsersHandler } from "../../src/app/api/users/search/route";
import { GET as getRoomsHandler } from "../../src/app/api/rooms/route";
import { POST as syncRoomsHandler } from "../../src/app/api/rooms/sync/route";
import { POST as findSlotsHandler } from "../../src/app/api/slots/find/route";
import { GET as getAgendaHandler } from "../../src/app/api/bookings/agenda/route";
import { POST as createBookingHandler } from "../../src/app/api/bookings/route";
import {
  PATCH as rescheduleBookingHandler,
  DELETE as cancelBookingHandler,
} from "../../src/app/api/bookings/[id]/route";
import { GET as getCalendarHandler } from "../../src/app/api/calendar/route";
import { seedDatabase } from "../../src/db/seed";

describe("REST API Route Handlers", () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  describe("GET /api/users/search", () => {
    test("returns user list JSON for matching query", async () => {
      const req = new Request("http://localhost:3000/api/users/search?q=alex");
      const res = await searchUsersHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].name).toContain("Alex");
    });

    test("returns user list when query param is omitted", async () => {
      const req = new Request("http://localhost:3000/api/users/search");
      const res = await searchUsersHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    test("respects limit parameter", async () => {
      const req = new Request("http://localhost:3000/api/users/search?limit=1");
      const res = await searchUsersHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
    });

    test("returns 400 for invalid limit parameter", async () => {
      const req = new Request("http://localhost:3000/api/users/search?limit=abc");
      const res = await searchUsersHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("GET /api/rooms", () => {
    test("returns list of rooms without filters", async () => {
      const req = new Request("http://localhost:3000/api/rooms");
      const res = await getRoomsHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(3);
    });

    test("filters rooms by minimum capacity", async () => {
      const req = new Request("http://localhost:3000/api/rooms?minCapacity=6");
      const res = await getRoomsHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2);
      expect(data.every((r: { capacity: number }) => r.capacity >= 6)).toBe(true);
    });

    test("filters rooms by feature", async () => {
      const req = new Request("http://localhost:3000/api/rooms?features=whiteboard");
      const res = await getRoomsHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.every((r: { features: string[] }) => r.features.includes("whiteboard"))).toBe(
        true
      );
    });

    test("filters rooms by building", async () => {
      const req = new Request("http://localhost:3000/api/rooms?building=HQ");
      const res = await getRoomsHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.every((r: { building: string | null }) => r.building === "HQ")).toBe(true);
    });

    test("returns 400 for invalid minCapacity query parameter", async () => {
      const req = new Request("http://localhost:3000/api/rooms?minCapacity=invalid");
      const res = await getRoomsHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("POST /api/rooms/sync", () => {
    test("triggers room sync and returns success or error response", async () => {
      const req = new Request("http://localhost:3000/api/rooms/sync", { method: "POST" });
      const res = await syncRoomsHandler(req);
      expect([200, 401, 403]).toContain(res.status);
      const data = await res.json();
      if (res.status === 200) {
        expect(data.success).toBe(true);
        expect(Array.isArray(data.rooms)).toBe(true);
      } else {
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      }
    });
  });

  describe("POST /api/slots/find", () => {
    test("finds open slots for valid parameters", async () => {
      const req = new Request("http://localhost:3000/api/slots/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendees: ["alex@company.com"],
          durationMinutes: 30,
          startDate: "2026-10-19T08:00:00.000Z",
          endDate: "2026-10-19T18:00:00.000Z",
        }),
      });

      const res = await findSlotsHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].start).toBeDefined();
      expect(data[0].end).toBeDefined();
      expect(data[0].available).toBe(true);
    });

    test("returns 400 when attendees list is empty", async () => {
      const req = new Request("http://localhost:3000/api/slots/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendees: [],
          startDate: "2026-10-19T08:00:00.000Z",
          endDate: "2026-10-19T18:00:00.000Z",
        }),
      });

      const res = await findSlotsHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("returns 400 when startDate is after endDate", async () => {
      const req = new Request("http://localhost:3000/api/slots/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendees: ["alex@company.com"],
          startDate: "2026-10-19T18:00:00.000Z",
          endDate: "2026-10-19T08:00:00.000Z",
        }),
      });

      const res = await findSlotsHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("returns 400 on malformed JSON payload", async () => {
      const req = new Request("http://localhost:3000/api/slots/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json",
      });

      const res = await findSlotsHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("JSON");
    });
  });

  describe("GET /api/bookings/agenda", () => {
    test("returns bookings for user on valid date", async () => {
      const req = new Request(
        "http://localhost:3000/api/bookings/agenda?date=2026-10-19T00:00:00.000Z&userId=usr_alex_rivera"
      );
      const res = await getAgendaHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("supports dateIso query parameter", async () => {
      const req = new Request(
        "http://localhost:3000/api/bookings/agenda?dateIso=2026-10-19T00:00:00.000Z&userId=usr_alex_rivera"
      );
      const res = await getAgendaHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("returns 400 when date is missing", async () => {
      const req = new Request("http://localhost:3000/api/bookings/agenda?userId=usr_alex_rivera");
      const res = await getAgendaHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("returns 400 when date format is invalid", async () => {
      const req = new Request(
        "http://localhost:3000/api/bookings/agenda?date=not-a-date&userId=usr_alex_rivera"
      );
      const res = await getAgendaHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("returns 400 when userId is missing and unauthenticated", async () => {
      const req = new Request(
        "http://localhost:3000/api/bookings/agenda?date=2026-10-19T00:00:00.000Z"
      );
      const res = await getAgendaHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("POST /api/bookings and /api/bookings/[id] lifecycle", () => {
    let createdBookingId: string;

    test("POST /api/bookings creates booking and returns 201", async () => {
      const req = new Request("http://localhost:3000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "API Design Review",
          description: "Review Next.js route handlers",
          organizerUserId: "usr_alex_rivera",
          startTime: "2026-10-20T10:00:00.000Z",
          endTime: "2026-10-20T11:00:00.000Z",
          attendees: ["alex@example.com", { email: "sarah@company.com", name: "Sarah Connor" }],
        }),
      });

      const res = await createBookingHandler(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.title).toBe("API Design Review");
      expect(data.status).toBe("confirmed");
      expect(data.meetingUrl).toBeDefined();
      createdBookingId = data.id;
    });

    test("POST /api/bookings returns 400 when required fields are missing", async () => {
      const req = new Request("http://localhost:3000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "Missing title",
        }),
      });

      const res = await createBookingHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("POST /api/bookings returns 400 when startTime >= endTime", async () => {
      const req = new Request("http://localhost:3000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Invalid Window",
          organizerUserId: "usr_alex_rivera",
          startTime: "2026-10-20T11:00:00.000Z",
          endTime: "2026-10-20T10:00:00.000Z",
        }),
      });

      const res = await createBookingHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("POST /api/bookings returns 400 on malformed JSON payload", async () => {
      const req = new Request("http://localhost:3000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "bad-json",
      });

      const res = await createBookingHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("JSON");
    });

    test("PATCH /api/bookings/[id] updates booking time", async () => {
      const req = new Request(`http://localhost:3000/api/bookings/${createdBookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: "2026-10-20T14:00:00.000Z",
          endTime: "2026-10-20T15:00:00.000Z",
        }),
      });

      const res = await rescheduleBookingHandler(req, {
        params: Promise.resolve({ id: createdBookingId }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(createdBookingId);
      expect(new Date(data.startTime).toISOString()).toBe("2026-10-20T14:00:00.000Z");
      expect(new Date(data.endTime).toISOString()).toBe("2026-10-20T15:00:00.000Z");
    });

    test("PATCH /api/bookings/[id] returns 404 for non-existent booking", async () => {
      const req = new Request("http://localhost:3000/api/bookings/non-existent-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: "2026-10-20T14:00:00.000Z",
          endTime: "2026-10-20T15:00:00.000Z",
        }),
      });

      const res = await rescheduleBookingHandler(req, {
        params: { id: "non-existent-id" },
      });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain("not found");
    });

    test("PATCH /api/bookings/[id] returns 400 for invalid time window", async () => {
      const req = new Request(`http://localhost:3000/api/bookings/${createdBookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: "2026-10-20T16:00:00.000Z",
          endTime: "2026-10-20T15:00:00.000Z",
        }),
      });

      const res = await rescheduleBookingHandler(req, {
        params: Promise.resolve({ id: createdBookingId }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("DELETE /api/bookings/[id] cancels booking and marks status cancelled", async () => {
      const req = new Request(`http://localhost:3000/api/bookings/${createdBookingId}`, {
        method: "DELETE",
      });

      const res = await cancelBookingHandler(req, {
        params: Promise.resolve({ id: createdBookingId }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(createdBookingId);
      expect(data.status).toBe("cancelled");
    });

    test("DELETE /api/bookings/[id] returns 404 for non-existent booking", async () => {
      const req = new Request("http://localhost:3000/api/bookings/non-existent-id", {
        method: "DELETE",
      });

      const res = await cancelBookingHandler(req, {
        params: { id: "non-existent-id" },
      });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain("not found");
    });

    test("PATCH /api/bookings/[id] returns 400 when attempting to reschedule cancelled booking", async () => {
      const req = new Request(`http://localhost:3000/api/bookings/${createdBookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: "2026-10-20T16:00:00.000Z",
          endTime: "2026-10-20T17:00:00.000Z",
        }),
      });

      const res = await rescheduleBookingHandler(req, {
        params: Promise.resolve({ id: createdBookingId }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("cancelled");
    });
  });

  describe("GET /api/calendar", () => {
    test("handles attendeeEmails with dots in usernames without throwing 500", async () => {
      const url =
        "http://localhost:3000/api/calendar?timeMin=2026-10-26T00:00:00.000Z&timeMax=2026-11-02T00:00:00.000Z&attendeeEmails=user.one%40example.com%2Cuser.two%40example.com%2Cuser.three%40example.com";
      const req = new Request(url);
      const res = await getCalendarHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.events)).toBe(true);
      expect(data.workingHours).toBeDefined();
    });
  });
});
