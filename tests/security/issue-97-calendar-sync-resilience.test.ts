import { describe, expect, test } from "bun:test";
import { db } from "@/db";
import { user, account, booking } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GoogleCalendarService } from "@/services/google-calendar";
import { GET as calendarGet } from "@/app/api/calendar/route";

describe("Issue #97 Calendar Sync Resilience", () => {
  test("C1: GoogleCalendarService.listEvents throws on transient failure rather than returning empty array", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({ error: { message: "Internal server error" } }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )) as unknown as typeof globalThis.fetch;

    try {
      await expect(
        GoogleCalendarService.listEvents("primary", {
          accessToken: "dummy-valid-token",
        }),
      ).rejects.toThrow("Google Calendar listEvents failed");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("C2: GET /api/calendar does not cancel DB bookings when Google fetch fails", async () => {
    const [testUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Sync Resilience User",
        email: `resilience-${Date.now()}@example.com`,
      })
      .returning();

    const [testAccount] = await db
      .insert(account)
      .values({
        id: crypto.randomUUID(),
        userId: testUser.id,
        providerId: "google",
        accountId: `google-${testUser.id}`,
        accessToken: "test-token",
        refreshToken: "test-refresh",
      })
      .returning();

    const now = Date.now();
    const [testBooking] = await db
      .insert(booking)
      .values({
        organizerUserId: testUser.id,
        title: "Important Client Meeting",
        status: "confirmed",
        startTime: new Date(now + 3600000),
        endTime: new Date(now + 7200000),
        gcalEventId: "google-event-xyz-123",
      })
      .returning();

    const originalFetch = globalThis.fetch;
    // Simulate 500 transient failure on Google Calendar API
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("googleapis.com")) {
        return new Response(
          JSON.stringify({ error: { message: "Backend Error" } }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      return originalFetch(input);
    }) as unknown as typeof globalThis.fetch;

    try {
      const req = new Request(
        `http://localhost:3000/api/calendar?userId=${testUser.id}`,
        {
          headers: {
            // In test environment, userId query param is recognized when effectiveUserId is evaluated
          },
        },
      );

      const res = await calendarGet(req);
      expect(res.status).toBe(200);

      // Verify booking in database is STILL confirmed (NOT cancelled!)
      const [reloadedBooking] = await db
        .select()
        .from(booking)
        .where(eq(booking.id, testBooking.id));

      expect(reloadedBooking).toBeDefined();
      expect(reloadedBooking.status).toBe("confirmed");
    } finally {
      globalThis.fetch = originalFetch;
      await db
        .delete(booking)
        .where(eq(booking.id, testBooking.id))
        .catch(() => {});
      await db
        .delete(account)
        .where(eq(account.id, testAccount.id))
        .catch(() => {});
      await db
        .delete(user)
        .where(eq(user.id, testUser.id))
        .catch(() => {});
    }
  });

  test("C3: GET /api/calendar does not cancel bookings with working location or transparent events", async () => {
    const [testUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: "Working Location User",
        email: `working-loc-${Date.now()}@example.com`,
      })
      .returning();

    const [testAccount] = await db
      .insert(account)
      .values({
        id: crypto.randomUUID(),
        userId: testUser.id,
        providerId: "google",
        accountId: `google-${testUser.id}`,
        accessToken: "test-token",
      })
      .returning();

    const now = Date.now();
    const gcalId = `work-loc-evt-${Date.now()}`;
    const [testBooking] = await db
      .insert(booking)
      .values({
        organizerUserId: testUser.id,
        title: "Working from Office",
        status: "confirmed",
        startTime: new Date(now + 3600000),
        endTime: new Date(now + 7200000),
        gcalEventId: gcalId,
      })
      .returning();

    const originalFetch = globalThis.fetch;
    // Simulate Google Calendar returning an active event that has working location title
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/events")) {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: gcalId,
                summary: "Working from Office (office)",
                status: "confirmed",
                start: { dateTime: new Date(now + 3600000).toISOString() },
                end: { dateTime: new Date(now + 7200000).toISOString() },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response("{}", { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    try {
      const req = new Request(
        `http://localhost:3000/api/calendar?userId=${testUser.id}`,
      );
      const res = await calendarGet(req);
      expect(res.status).toBe(200);

      // Verify the booking is NOT cancelled!
      const [reloadedBooking] = await db
        .select()
        .from(booking)
        .where(eq(booking.id, testBooking.id));

      expect(reloadedBooking).toBeDefined();
      expect(reloadedBooking.status).toBe("confirmed");
    } finally {
      globalThis.fetch = originalFetch;
      await db
        .delete(booking)
        .where(eq(booking.id, testBooking.id))
        .catch(() => {});
      await db
        .delete(account)
        .where(eq(account.id, testAccount.id))
        .catch(() => {});
      await db
        .delete(user)
        .where(eq(user.id, testUser.id))
        .catch(() => {});
    }
  });

  test("C4: GoogleCalendarService.listEvents paginates across multiple pages", async () => {
    let callCount = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      callCount++;
      const pageToken = url.searchParams.get("pageToken");

      if (!pageToken) {
        return new Response(
          JSON.stringify({
            items: [{ id: "event-page-1", summary: "First Page Event" }],
            nextPageToken: "page_2_token",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      } else {
        return new Response(
          JSON.stringify({
            items: [{ id: "event-page-2", summary: "Second Page Event" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
    }) as unknown as typeof globalThis.fetch;

    try {
      const events = await GoogleCalendarService.listEvents("primary", {
        accessToken: "valid-token",
      });

      expect(callCount).toBe(2);
      expect(events.length).toBe(2);
      expect(events.map((e) => e.id)).toEqual(["event-page-1", "event-page-2"]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
