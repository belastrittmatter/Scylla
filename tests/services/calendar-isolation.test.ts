import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { GoogleCalendarService } from "../../src/services/google-calendar";
import { CalendarEventTracker } from "../../src/utils/calendar-event-tracker";
import { handleMockGoogleRequest, resetMockEvents } from "../../src/utils/mock-google-calendar";

describe("Google Calendar Isolation & Auto-cleanup", () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origMockMode = process.env.CALENDAR_MOCK_MODE;
  const origForceLive = process.env.CALENDAR_FORCE_LIVE;

  beforeEach(() => {
    CalendarEventTracker.clear();
    resetMockEvents();
    delete process.env.CALENDAR_FORCE_LIVE;
    process.env.CALENDAR_MOCK_MODE = "true";
  });

  afterEach(async () => {
    await CalendarEventTracker.cleanupAll();
    (process.env as Record<string, string | undefined>).NODE_ENV = origNodeEnv;
    if (origMockMode !== undefined) {
      process.env.CALENDAR_MOCK_MODE = origMockMode;
    } else {
      delete process.env.CALENDAR_MOCK_MODE;
    }
    if (origForceLive !== undefined) {
      process.env.CALENDAR_FORCE_LIVE = origForceLive;
    } else {
      delete process.env.CALENDAR_FORCE_LIVE;
    }
  });

  test("isMockMode defaults to true in test environment", () => {
    expect(GoogleCalendarService.isMockMode()).toBe(true);

    process.env.CALENDAR_FORCE_LIVE = "true";
    expect(GoogleCalendarService.isMockMode()).toBe(false);
  });

  test("handleMockGoogleRequest intercepts event creation and retrieval", async () => {
    const createRes = handleMockGoogleRequest(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: "[TEST] Standup Sync",
          start: { dateTime: "2026-10-22T10:00:00Z" },
          end: { dateTime: "2026-10-22T10:30:00Z" },
        }),
      }
    );
    expect(createRes).toBeDefined();
    expect(createRes.status).toBe(200);

    const createdData = (await createRes.json()) as { id: string; summary: string };
    expect(createdData.id).toMatch(/^gcal_mock_/);
    expect(createdData.summary).toBe("[TEST] Standup Sync");

    const listRes = handleMockGoogleRequest(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      { method: "GET" }
    );
    expect(listRes).toBeDefined();
    expect(listRes.status).toBe(200);

    const listData = (await listRes.json()) as { items: Array<{ id: string }> };
    expect(Array.isArray(listData.items)).toBe(true);
    expect(listData.items.some((item) => item.id === createdData.id)).toBe(true);

    // Verify single event GET /events/{eventId} returns the single object, not a list
    const singleRes = handleMockGoogleRequest(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${createdData.id}`,
      { method: "GET" }
    );
    expect(singleRes.status).toBe(200);
    const singleData = (await singleRes.json()) as { id: string; summary: string };
    expect(singleData.id).toBe(createdData.id);
    expect(singleData.summary).toBe("[TEST] Standup Sync");
  });

  test("handleMockGoogleRequest intercepts freeBusy queries", async () => {
    const res = handleMockGoogleRequest("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timeMin: "2026-10-22T08:00:00Z",
        timeMax: "2026-10-22T18:00:00Z",
        items: [{ id: "primary" }],
      }),
    });

    expect(res).toBeDefined();
    expect(res.status).toBe(200);

    const data = (await res.json()) as { calendars: Record<string, { busy: unknown[] }> };
    expect(data.calendars.primary).toBeDefined();
    expect(Array.isArray(data.calendars.primary.busy)).toBe(true);
  });

  test("CalendarEventTracker tracks and clears event IDs", () => {
    CalendarEventTracker.track("mock-evt-1");
    CalendarEventTracker.track("mock-evt-2");

    expect(CalendarEventTracker.getTrackedIds()).toEqual(["mock-evt-1", "mock-evt-2"]);

    CalendarEventTracker.untrack("mock-evt-1");
    expect(CalendarEventTracker.getTrackedIds()).toEqual(["mock-evt-2"]);

    CalendarEventTracker.clear();
    expect(CalendarEventTracker.getTrackedIds()).toEqual([]);
  });

  test("CalendarEventTracker.cleanupAll attempts deletion for all tracked events", async () => {
    const deletedIds: string[] = [];
    CalendarEventTracker.track("evt-cleanup-1");
    CalendarEventTracker.track("evt-cleanup-2");

    await CalendarEventTracker.cleanupAll(async (id) => {
      deletedIds.push(id);
    });

    expect(deletedIds).toEqual(["evt-cleanup-1", "evt-cleanup-2"]);
    expect(CalendarEventTracker.getTrackedIds()).toEqual([]);
  });

  test("GoogleCalendarService registers and tracks created events in mock mode", async () => {
    const event = await GoogleCalendarService.createEvent({
      summary: "[TEST] Auto Tracked Meeting",
      start: new Date("2026-10-22T14:00:00Z"),
      end: new Date("2026-10-22T15:00:00Z"),
    });

    expect(event.id).toBeDefined();
    expect(GoogleCalendarService.getTrackedEventIds()).toContain(event.id);

    await GoogleCalendarService.deleteEvent(event.id);
    expect(GoogleCalendarService.getTrackedEventIds()).not.toContain(event.id);
  });
});
