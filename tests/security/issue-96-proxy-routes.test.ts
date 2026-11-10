import { describe, expect, it } from "bun:test";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { GET as searchUsersHandler } from "@/app/api/users/search/route";
import { POST as findSlotsHandler } from "@/app/api/slots/find/route";
import {
  GET as getBusyHandler,
  POST as postBusyHandler,
} from "@/app/api/calendar/busy/route";
import {
  GET as getEventTypesHandler,
  POST as createEventTypeHandler,
} from "@/app/api/event-types/route";
import { db } from "@/db";
import { eventType, user } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("Security Issue #96: Proxy and Route Session Hardening", () => {
  it("proxy blocks forged session cookie on protected API routes with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/bookings", {
      headers: {
        cookie: "better-auth.session_token=forged-invalid-session-token",
      },
    });
    const res = await proxy(req);
    expect(res.status).toBe(401);
  });

  it("GET /api/users/search returns 401 when unauthenticated", async () => {
    const req = new Request("http://localhost:3000/api/users/search");
    const res = await searchUsersHandler(req);
    expect(res.status).toBe(401);
  });

  it("GET /api/users/search caps limit to 50", async () => {
    const req = new Request(
      "http://localhost:3000/api/users/search?limit=1000",
      {
        headers: { "x-user-id": "usr_alex_rivera" },
      },
    );
    const res = await searchUsersHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(50);
  });

  it("POST /api/slots/find returns 401 when unauthenticated", async () => {
    const req = new Request("http://localhost:3000/api/slots/find", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attendees: ["test@example.com"],
        startDate: "2026-10-19T08:00:00.000Z",
        endDate: "2026-10-19T18:00:00.000Z",
      }),
    });
    const res = await findSlotsHandler(req);
    expect(res.status).toBe(401);
  });

  it("POST /api/slots/find rejects requests with more than 20 attendees", async () => {
    const excessiveAttendees = Array.from(
      { length: 25 },
      (_, i) => `user${i}@example.com`,
    );
    const req = new Request("http://localhost:3000/api/slots/find", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "usr_alex_rivera",
      },
      body: JSON.stringify({
        attendees: excessiveAttendees,
        startDate: "2026-10-19T08:00:00.000Z",
        endDate: "2026-10-19T18:00:00.000Z",
      }),
    });
    const res = await findSlotsHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Maximum 20 attendees");
  });

  it("POST /api/slots/find rejects date windows exceeding 60 days", async () => {
    const req = new Request("http://localhost:3000/api/slots/find", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "usr_alex_rivera",
      },
      body: JSON.stringify({
        attendees: ["alex@example.com"],
        startDate: "2026-01-01T08:00:00.000Z",
        endDate: "2026-06-01T18:00:00.000Z",
      }),
    });
    const res = await findSlotsHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("60 days");
  });

  it("GET /api/calendar/busy returns 401 when unauthenticated", async () => {
    const req = new Request(
      "http://localhost:3000/api/calendar/busy?emails=test@example.com",
    );
    const res = await getBusyHandler(req);
    expect(res.status).toBe(401);
  });

  it("POST /api/calendar/busy returns 401 when unauthenticated", async () => {
    const req = new Request("http://localhost:3000/api/calendar/busy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: ["test@example.com"] }),
    });
    const res = await postBusyHandler(req);
    expect(res.status).toBe(401);
  });

  it("GET /api/event-types returns 401 when unauthenticated", async () => {
    const req = new Request("http://localhost:3000/api/event-types");
    const res = await getEventTypesHandler(req);
    expect(res.status).toBe(401);
  });

  it("POST /api/event-types returns 401 when unauthenticated", async () => {
    const req = new Request("http://localhost:3000/api/event-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "1-on-1 Meeting",
        userId: "victim-user-id",
      }),
    });
    const res = await createEventTypeHandler(req);
    expect(res.status).toBe(401);
  });

  it("POST /api/event-types binds created event type to caller session user and ignores spoofed body.userId", async () => {
    const req = new Request("http://localhost:3000/api/event-types", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "usr_alex_rivera",
      },
      body: JSON.stringify({
        name: "Security Review Catchup",
        userId: "victim_spoofed_user_id",
      }),
    });
    const res = await createEventTypeHandler(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.userId).toBe("usr_alex_rivera");
    expect(data.userId).not.toBe("victim_spoofed_user_id");

    if (data.id) {
      await db.delete(eventType).where(eq(eventType.id, data.id));
    }
  });

  it("POST /api/slots/find rejects cross-tenant user query even with leading spaces in attendees", async () => {
    // usr_alex_rivera belongs to team-alpha. We create a foreign user in a separate team.
    const foreignUser = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Foreign User",
        email: `foreign-${Date.now()}@other.com`,
      })
      .returning();

    try {
      const res = await findSlotsHandler(
        new Request("http://localhost:3000/api/slots/find", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": "usr_alex_rivera",
          },
          body: JSON.stringify({
            attendees: [`  ${foreignUser[0].email}  `],
            startDate: "2026-10-19T08:00:00.000Z",
            endDate: "2026-10-19T18:00:00.000Z",
          }),
        }),
      );
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden");
    } finally {
      await db.delete(user).where(eq(user.id, foreignUser[0].id));
    }
  });

  it("GET /api/calendar/busy rejects spoofed room email suffix", async () => {
    const res = await getBusyHandler(
      new Request(
        "http://localhost:3000/api/calendar/busy?emails=x+resource.calendar.google.com@evil.com",
        {
          headers: { "x-user-id": "usr_alex_rivera" },
        },
      ),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    // evil domain should not be recognized as a valid room
    const evilEntry =
      data.calendars?.["x+resource.calendar.google.com@evil.com"];
    expect(evilEntry).toBeUndefined();
  });
});
