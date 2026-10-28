import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { GoogleCalendarService } from "../../src/services/google-calendar";

describe("GoogleCalendarService", () => {
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.GOOGLE_ACCESS_TOKEN;

  beforeEach(() => {
    process.env.GOOGLE_ACCESS_TOKEN = "test-token";

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/resources/calendars")) {
        return new Response(
          JSON.stringify({
            items: [
              {
                resourceId: "res_room_alpha",
                resourceName: "Focus Room Alpha (2p)",
                resourceEmail: "room-alpha@resource.calendar.google.com",
                capacity: 2,
                featureInstances: [{ feature: { name: "screen" } }],
                buildingId: "Building A",
                floorName: "1",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/admin/directory/v1/users")) {
        if (url.includes("nonexistent-user-xyz-999")) {
          return new Response(JSON.stringify({ users: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(
          JSON.stringify({
            users: [
              {
                id: "usr_alex_rivera",
                name: { fullName: "Alex Rivera" },
                primaryEmail: "alex@example.com",
              },
              {
                id: "usr_test_user",
                name: { fullName: "Test User" },
                primaryEmail: "test@example.com",
              },
              {
                id: "usr_user1",
                name: { fullName: "User One" },
                primaryEmail: "user1@example.com",
              },
              {
                id: "usr_sarah_chen",
                name: { fullName: "Sarah Chen" },
                primaryEmail: "sarah@example.com",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/freeBusy")) {
        let bodyObj: { items?: Array<{ id: string }> } = {};
        if (init?.body) {
          try {
            bodyObj = JSON.parse(String(init.body));
          } catch {
            // ignore
          }
        }
        const calendars: Record<string, { busy: Array<{ start: string; end: string }> }> = {};
        for (const item of bodyObj.items || []) {
          calendars[item.id] = {
            busy: [
              {
                start: "2026-10-16T10:00:00.000Z",
                end: "2026-10-16T11:00:00.000Z",
              },
            ],
          };
        }
        return new Response(JSON.stringify({ calendars }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/events") && init?.method === "POST") {
        const bodyObj = init?.body ? JSON.parse(String(init.body)) : {};
        return new Response(
          JSON.stringify({
            id: "gcal_event_123",
            status: "confirmed",
            summary: bodyObj.summary,
            description: bodyObj.description,
            hangoutLink: "https://meet.google.com/abc-defg-hij",
            start: bodyObj.start,
            end: bodyObj.end,
            attendees: bodyObj.attendees,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/events/") && init?.method === "PATCH") {
        const bodyObj = init?.body ? JSON.parse(String(init.body)) : {};
        return new Response(
          JSON.stringify({
            id: "gcal_event_123",
            status: "confirmed",
            summary: bodyObj.summary || "Updated Meeting Title",
            hangoutLink: "https://meet.google.com/abc-defg-hij",
            start: bodyObj.start || { dateTime: "2026-10-16T10:00:00.000Z" },
            end: bodyObj.end || { dateTime: "2026-10-16T11:00:00.000Z" },
            attendees: bodyObj.attendees || [],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/events/") && init?.method === "DELETE") {
        return new Response(null, { status: 204 });
      }

      if (url.includes("/events")) {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: "gcal_event_123",
                status: "confirmed",
                summary: "Sync Team Standup",
                hangoutLink: "https://meet.google.com/abc-defg-hij",
                start: { dateTime: "2026-10-16T10:00:00.000Z" },
                end: { dateTime: "2026-10-16T11:00:00.000Z" },
                attendees: [{ email: "alex@example.com" }],
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalToken !== undefined) {
      process.env.GOOGLE_ACCESS_TOKEN = originalToken;
    } else {
      delete process.env.GOOGLE_ACCESS_TOKEN;
    }
  });

  test("listResourceRooms returns structured room resources", async () => {
    const rooms = await GoogleCalendarService.listResourceRooms();
    expect(Array.isArray(rooms)).toBe(true);
    expect(rooms.length).toBeGreaterThan(0);
    expect(rooms[0]).toHaveProperty("email");
    expect(rooms[0]).toHaveProperty("capacity");
    expect(rooms[0]).toHaveProperty("name");
    expect(typeof rooms[0].capacity).toBe("number");
  });

  test("searchDirectoryUsers returns matching directory users", async () => {
    const users = await GoogleCalendarService.searchDirectoryUsers("alex");
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
    expect(users[0].name.toLowerCase()).toContain("alex");
    expect(users[0]).toHaveProperty("email");
  });

  test("searchDirectoryUsers returns empty array for non-matching query", async () => {
    const users = await GoogleCalendarService.searchDirectoryUsers("nonexistent-user-xyz-999");
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBe(0);
  });

  test("getFreeBusy returns busy intervals per email", async () => {
    const now = new Date();
    const later = new Date(now.getTime() + 24 * 3600 * 1000);
    const emails = ["test@example.com", "room-alpha@resource.calendar.google.com"];
    const result = await GoogleCalendarService.getFreeBusy(emails, now, later);

    expect(result).toHaveProperty(["test@example.com"]);
    expect(result).toHaveProperty(["room-alpha@resource.calendar.google.com"]);
    expect(Array.isArray(result["test@example.com"])).toBe(true);
    expect(Array.isArray(result["room-alpha@resource.calendar.google.com"])).toBe(true);
  });

  test("getFreeBusy handles emails with dots in usernames and returns strictly arrays", async () => {
    const now = new Date();
    const later = new Date(now.getTime() + 24 * 3600 * 1000);
    const emails = [
      "user.one@example.com",
      "user.two@example.com",
      "user.three@example.com",
    ];
    const result = await GoogleCalendarService.getFreeBusy(emails, now, later);

    // Keys must strictly be the requested emails, not decomposed string tokens
    expect(Object.keys(result).sort()).toEqual(emails.sort());
    for (const [, intervals] of Object.entries(result)) {
      expect(Array.isArray(intervals)).toBe(true);
      for (const interval of intervals) {
        expect(interval.start).toBeDefined();
      }
    }
  });

  test("createEvent creates an event with meeting details and returns event id and meetingUrl", async () => {
    const now = new Date();
    const later = new Date(now.getTime() + 30 * 60 * 1000);

    const event = await GoogleCalendarService.createEvent({
      title: "Test Sync Meeting",
      description: "Discussing quarterly roadmap",
      start: now,
      end: later,
      attendees: ["alex@example.com", "test@example.com"],
      roomEmail: "room-alpha@resource.calendar.google.com",
    });

    expect(event).toBeDefined();
    expect(event.id).toBeDefined();
    expect(typeof event.id).toBe("string");
    expect(event.status).toBe("confirmed");
    expect(event.meetingUrl).toBeDefined();
    expect(typeof event.meetingUrl).toBe("string");
    expect(event.attendees.map((a) => a.email)).toContain("alex@example.com");
    expect(event.attendees.map((a) => a.email)).toContain(
      "room-alpha@resource.calendar.google.com"
    );
  });

  test("updateEvent modifies event time and summary", async () => {
    const now = new Date();
    const newStart = new Date(now.getTime() + 60 * 60 * 1000);
    const newEnd = new Date(now.getTime() + 90 * 60 * 1000);

    const updated = await GoogleCalendarService.updateEvent("gcal_event_123", {
      title: "Updated Meeting Title",
      start: newStart,
      end: newEnd,
    });

    expect(updated).toBeDefined();
    expect(updated.id).toBe("gcal_event_123");
    expect(updated.summary).toBe("Updated Meeting Title");
  });

  test("deleteEvent successfully removes an event", async () => {
    const result = await GoogleCalendarService.deleteEvent("gcal_event_123");
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.id).toBe("gcal_event_123");
  });

  test("searchDirectoryUsers with empty query returns all directory users", async () => {
    const allUsers = await GoogleCalendarService.searchDirectoryUsers("");
    expect(allUsers.length).toBeGreaterThanOrEqual(4);
  });

  test("isMock correctly indicates mock status based on credentials and token", () => {
    expect(typeof GoogleCalendarService.isMock()).toBe("boolean");
    expect(GoogleCalendarService.isMock("mock-valid-token")).toBe(false);
  });

  test("getFreeBusy returns realistic intervals for known mock emails", async () => {
    const now = new Date("2026-10-16T08:00:00.000Z");
    const later = new Date("2026-10-16T18:00:00.000Z");
    const result = await GoogleCalendarService.getFreeBusy(
      ["alex@example.com", "user1@example.com", "other@example.com"],
      now,
      later
    );

    expect(Array.isArray(result["alex@example.com"])).toBe(true);
    expect(Array.isArray(result["user1@example.com"])).toBe(true);
    expect(Array.isArray(result["other@example.com"])).toBe(true);
  });

  test("createEvent supports object-style attendees without roomEmail", async () => {
    const now = new Date();
    const event = await GoogleCalendarService.createEvent({
      title: "Virtual Only Meeting",
      start: now,
      end: new Date(now.getTime() + 45 * 60 * 1000),
      attendees: [{ email: "user1@example.com", name: "User One" }, "alex@example.com"],
    });

    expect(event.attendees.length).toBeGreaterThanOrEqual(1);
    expect(event.attendees.some((a) => a.email === "user1@example.com")).toBe(true);
    expect(event.roomEmail).toBeUndefined();
  });

  test("getFreeBusy handles empty emails array", async () => {
    const result = await GoogleCalendarService.getFreeBusy([], new Date(), new Date());
    expect(Object.keys(result).length).toBe(0);
  });

  test("listEvents returns array of calendar events", async () => {
    const events = await GoogleCalendarService.listEvents();
    expect(Array.isArray(events)).toBe(true);
    expect(events.some((e) => e.id === "gcal_event_123" || e.summary === "Sync Team Standup")).toBe(
      true
    );
  });
});
