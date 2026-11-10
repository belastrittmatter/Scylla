import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";
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
import { booking, eventType, team, teamMember, user } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { UserService } from "@/services/user";
import { GoogleCalendarService } from "@/services/google-calendar";
import { SchedulerService } from "@/services/scheduler";

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

describe("Security Issue #96: tenant scoping", () => {
  const tag = `scope${Date.now()}`;
  const callerId = `usr_${tag}_caller`;
  const teammateId = `usr_${tag}_mate`;
  const outsiderId = `usr_${tag}_out`;
  const teammateEmail = `${tag}.mate@example.com`;
  const outsiderEmail = `${tag}.out@other.com`;

  beforeAll(async () => {
    await db.insert(user).values([
      {
        id: callerId,
        name: `${tag} Caller`,
        email: `${tag}.caller@example.com`,
      },
      { id: teammateId, name: `${tag} Mate`, email: teammateEmail },
      { id: outsiderId, name: `${tag} Outsider`, email: outsiderEmail },
    ]);
    const [t] = await db
      .insert(team)
      .values({ name: tag, slug: tag, ownerId: callerId })
      .returning();
    await db.insert(teamMember).values([
      { teamId: t.id, userId: callerId, role: "owner" },
      { teamId: t.id, userId: teammateId },
    ]);
  });

  afterAll(async () => {
    await db
      .delete(user)
      .where(inArray(user.id, [callerId, teammateId, outsiderId]));
  });

  const asCaller = (url: string, init: RequestInit = {}) =>
    new Request(`http://localhost:3000${url}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-user-id": callerId,
        ...(init.headers as Record<string, string> | undefined),
      },
    });

  describe("user search", () => {
    afterEach(() => mock.restore());

    it("GET /api/users/search returns teammates and never other-tenant users", async () => {
      const res = await searchUsersHandler(
        asCaller(`/api/users/search?q=${tag}`),
      );
      expect(res.status).toBe(200);
      const ids = ((await res.json()) as Array<{ id: string }>).map(
        (u) => u.id,
      );
      expect(ids).toContain(teammateId);
      expect(ids).not.toContain(outsiderId);
    });

    it("searchTeammates fails closed without a caller id", async () => {
      const results = await UserService.searchTeammates(tag, 20, {
        currentUserId: "",
      });
      expect(results).toEqual([]);
    });

    it("searchTeammates ignores one-character queries", async () => {
      const results = await UserService.searchTeammates("s", 20, {
        currentUserId: callerId,
      });
      expect(results).toEqual([]);
    });

    it("searchTeammates caps the limit at 50", async () => {
      const results = await UserService.searchTeammates("", 1000, {
        currentUserId: callerId,
      });
      expect(results.length).toBeLessThanOrEqual(50);
    });

    it("directory results are limited to the caller's teammates", async () => {
      spyOn(GoogleCalendarService, "searchDirectoryUsers").mockResolvedValue([
        { id: "d1", name: `${tag} Mate`, email: teammateEmail, title: "Eng" },
        { id: "d2", name: `${tag} Stranger`, email: `${tag}.x@corp.com` },
        { id: "d3", name: `${tag} Outsider`, email: outsiderEmail },
      ]);
      const results = await UserService.searchTeammates(tag, 20, {
        currentUserId: callerId,
        accessToken: "caller-token",
      });
      const emails = results.map((u) => u.email);
      expect(emails).toContain(teammateEmail);
      expect(emails).not.toContain(outsiderEmail);
      expect(emails).not.toContain(`${tag}.x@corp.com`);
    });
  });

  describe("slot finding", () => {
    afterEach(() => mock.restore());

    // Tuesday 09:00-11:00 Asia/Ho_Chi_Minh, inside default working hours
    const window = {
      startDate: "2026-10-20T02:00:00.000Z",
      endDate: "2026-10-20T04:00:00.000Z",
      durationMinutes: 60,
    };
    const findSlots = (attendees: string[]) =>
      findSlotsHandler(
        asCaller("/api/slots/find", {
          method: "POST",
          body: JSON.stringify({ ...window, attendees }),
        }),
      );

    it("rejects attendee emails that are not registered teammates", async () => {
      const res = await findSlots([`${tag}.nobody@unknown.test`]);
      expect(res.status).toBe(403);
    });

    it("never queries Google with server credentials when the caller has no linked account", async () => {
      const freeBusySpy = spyOn(GoogleCalendarService, "getFreeBusy");
      const res = await findSlots([teammateEmail]);
      expect(res.status).toBe(200);
      expect(freeBusySpy).not.toHaveBeenCalled();
    });

    it("blocks slots for teammate attendee bookings but ignores unrelated tenants' bookings", async () => {
      const [blocking, unrelated] = await db
        .insert(booking)
        .values([
          {
            title: `${tag} blocking`,
            organizerUserId: outsiderId,
            startTime: new Date("2026-10-20T02:00:00.000Z"),
            endTime: new Date("2026-10-20T03:00:00.000Z"),
            attendees: [{ email: teammateEmail.toUpperCase() }],
          },
          {
            title: `${tag} unrelated`,
            organizerUserId: outsiderId,
            startTime: new Date("2026-10-20T03:00:00.000Z"),
            endTime: new Date("2026-10-20T04:00:00.000Z"),
            attendees: [{ email: outsiderEmail }],
          },
        ])
        .returning();
      try {
        const res = await findSlots([teammateEmail]);
        const starts = ((await res.json()) as Array<{ start: string }>).map(
          (s) => s.start,
        );
        expect(starts).not.toContain("2026-10-20T02:00:00.000Z");
        expect(starts).toContain("2026-10-20T03:00:00.000Z");
      } finally {
        await db
          .delete(booking)
          .where(inArray(booking.id, [blocking.id, unrelated.id]));
      }
    });
  });

  describe("error responses", () => {
    afterEach(() => mock.restore());
    const secret = "pg relation user leaked connection string";

    it("users/search, slots/find and event-types hide internal error text", async () => {
      spyOn(console, "error").mockImplementation(() => {});
      spyOn(UserService, "searchTeammates").mockRejectedValue(
        new Error(secret),
      );
      spyOn(SchedulerService, "findSlots").mockRejectedValue(new Error(secret));
      spyOn(SchedulerService, "createEventType").mockRejectedValue(
        new Error(secret),
      );
      const responses = await Promise.all([
        searchUsersHandler(asCaller(`/api/users/search?q=${tag}`)),
        findSlotsHandler(
          asCaller("/api/slots/find", {
            method: "POST",
            body: JSON.stringify({
              attendees: [teammateEmail],
              startDate: "2026-10-20T02:00:00.000Z",
              endDate: "2026-10-20T04:00:00.000Z",
            }),
          }),
        ),
        createEventTypeHandler(
          asCaller("/api/event-types", {
            method: "POST",
            body: JSON.stringify({ name: "x" }),
          }),
        ),
      ]);
      for (const res of responses) {
        expect(res.status).toBe(500);
        expect(JSON.stringify(await res.json())).not.toContain(secret);
      }
    });
  });

  describe("busy query", () => {
    afterEach(() => mock.restore());
    const busy = (body: unknown) =>
      postBusyHandler(
        asCaller("/api/calendar/busy", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      );

    it("includes bookings where the teammate is only an attendee", async () => {
      const [b] = await db
        .insert(booking)
        .values({
          title: `${tag} attendee only`,
          organizerUserId: outsiderId,
          startTime: new Date("2026-10-21T02:00:00.000Z"),
          endTime: new Date("2026-10-21T03:00:00.000Z"),
          attendees: [{ email: teammateEmail }],
        })
        .returning();
      try {
        const res = await busy({
          userIds: [teammateId],
          timeMin: "2026-10-21T00:00:00.000Z",
          timeMax: "2026-10-22T00:00:00.000Z",
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.calendars[teammateEmail].busy).toContainEqual(
          expect.objectContaining({
            start: "2026-10-21T02:00:00.000Z",
            source: "db",
          }),
        );
      } finally {
        await db.delete(booking).where(eq(booking.id, b.id));
      }
    });

    it("never returns calendars for other-tenant users", async () => {
      const res = await busy({
        userIds: [outsiderId],
        emails: [outsiderEmail],
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.calendars[outsiderEmail]).toBeUndefined();
    });

    it("caps the number of requested ids and emails", async () => {
      const many = Array.from({ length: 51 }, (_, i) => `id${i}`);
      for (const key of ["userIds", "roomIds", "emails"]) {
        const res = await busy({ [key]: many });
        expect(res.status).toBe(400);
      }
      const getRes = await getBusyHandler(
        asCaller(`/api/calendar/busy?userIds=${many.join(",")}`),
      );
      expect(getRes.status).toBe(400);
    });

    it("rejects time ranges longer than 62 days", async () => {
      const res = await busy({
        timeMin: "2026-01-01T00:00:00.000Z",
        timeMax: "2026-03-15T00:00:00.000Z",
      });
      expect(res.status).toBe(400);
    });

    it("logs and hides unexpected failures", async () => {
      const errorSpy = spyOn(console, "error").mockImplementation(() => {});
      spyOn(UserService, "getTeammateIds").mockRejectedValue(
        new Error("pg boom detail"),
      );
      const res = await busy({ userIds: [teammateId] });
      expect(res.status).toBe(500);
      expect(JSON.stringify(await res.json())).not.toContain("pg boom");
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
