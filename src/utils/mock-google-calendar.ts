/**
 * In-memory mock response dispatcher for Google Calendar and Directory API endpoints.
 * Prevents real HTTP traffic and prevents polluting real Google Calendars during tests.
 */
import { CalendarEventTracker } from "./calendar-event-tracker";
import { MOCK_ROOMS, MOCK_DIRECTORY_USERS } from "./mock-google-calendar-data";

const inMemoryEvents = new Map<string, Record<string, unknown>>();

export function resetMockEvents(): void {
  inMemoryEvents.clear();
}

function jsonRes(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function isGoogleApiUrl(url: string): boolean {
  return (
    url.includes("googleapis.com") ||
    url.includes("oauth2.googleapis.com") ||
    url.includes("accounts.google.com")
  );
}

function handleEventMutation(url: string, method: string, body: Record<string, unknown>): Response {
  if (method === "POST") {
    const eventId = `gcal_mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    CalendarEventTracker.track(eventId);
    const event = {
      id: eventId,
      status: "confirmed",
      summary: body.summary || "Scheduled Meeting",
      description: body.description,
      hangoutLink: "https://meet.google.com/abc-defg-hij",
      htmlLink: `https://calendar.google.com/calendar/event?eid=${eventId}`,
      conferenceData: {
        entryPoints: [{ entryPointType: "video", uri: "https://meet.google.com/abc-defg-hij" }],
      },
      start: body.start || { dateTime: new Date().toISOString() },
      end: body.end || { dateTime: new Date(Date.now() + 3600000).toISOString() },
      attendees: body.attendees || [],
    };
    inMemoryEvents.set(eventId, event);
    return jsonRes(event);
  }

  if (method === "PATCH" || method === "PUT") {
    const parts = url.split("/events/");
    const eventId = parts[1]?.split("?")[0] || "gcal_mock_event";
    const existing = inMemoryEvents.get(eventId) || {};
    const updated = {
      ...existing,
      id: eventId,
      status: "confirmed",
      summary: body.summary || existing.summary || "Updated Meeting",
      description: body.description ?? existing.description,
      hangoutLink: "https://meet.google.com/abc-defg-hij",
      start: body.start || existing.start || { dateTime: new Date().toISOString() },
      end: body.end || existing.end || { dateTime: new Date(Date.now() + 3600000).toISOString() },
      attendees: body.attendees || existing.attendees || [],
    };
    inMemoryEvents.set(eventId, updated);
    return jsonRes(updated);
  }

  if (method === "DELETE") {
    const parts = url.split("/events/");
    const eventId = parts[1]?.split("?")[0];
    if (eventId) {
      CalendarEventTracker.untrack(eventId);
      inMemoryEvents.delete(eventId);
    }
    return new Response(null, { status: 204 });
  }

  // Handle single event GET /events/{eventId} vs list GET /events
  const parts = url.split("/events/");
  const singleEventId = parts[1]?.split("?")[0];
  if (method === "GET" && singleEventId && singleEventId.length > 0) {
    const single = inMemoryEvents.get(singleEventId);
    if (single) {
      return jsonRes(single);
    }
    if (singleEventId === "mock_event_default") {
      return jsonRes({
        id: "mock_event_default",
        summary: "Team Sync",
        organizer: { email: "alex@example.com", displayName: "Alex Rivera" },
        attendees: [
          { email: "sarah@example.com", displayName: "Sarah Chen" },
          { email: "alex@example.com", displayName: "Alex Rivera" },
        ],
        start: { dateTime: "2026-10-20T10:00:00.000Z" },
        end: { dateTime: "2026-10-20T11:00:00.000Z" },
      });
    }
    return jsonRes({ error: { code: 404, message: "Not Found" } }, 404);
  }

  return jsonRes({
    items: [
      {
        id: "mock_event_default",
        summary: "Team Sync",
        organizer: { email: "alex@example.com", displayName: "Alex Rivera" },
        attendees: [
          { email: "sarah@example.com", displayName: "Sarah Chen" },
          { email: "alex@example.com", displayName: "Alex Rivera" },
        ],
        start: { dateTime: "2026-10-20T10:00:00.000Z" },
        end: { dateTime: "2026-10-20T11:00:00.000Z" },
      },
      ...Array.from(inMemoryEvents.values()),
    ],
  });
}

export function handleMockGoogleRequest(
  input: string | URL | Request,
  init?: RequestInit
): Response {
  let url = "";
  let method = init?.method?.toUpperCase() || "GET";
  const bodyStr = typeof init?.body === "string" ? init.body : undefined;

  if (typeof input === "string") {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (typeof (input as Request)?.url === "string") {
    url = (input as Request).url;
    method = init?.method?.toUpperCase() || (input as Request).method.toUpperCase();
  }

  let bodyObj: Record<string, unknown> = {};
  if (bodyStr) {
    try {
      bodyObj = JSON.parse(bodyStr);
    } catch {
      // ignore
    }
  }

  if (url.includes("/token")) {
    return jsonRes({
      access_token: "mock-refreshed-token",
      token_type: "Bearer",
      expires_in: 3600,
    });
  }
  if (url.includes("/resources/calendars")) {
    return jsonRes({ items: MOCK_ROOMS });
  }
  if (url.includes("/admin/directory/v1/users")) {
    const q = new URL(url).searchParams.get("query")?.toLowerCase();
    return jsonRes({
      users: q
        ? MOCK_DIRECTORY_USERS.filter(
            (u) =>
              u.name.fullName.toLowerCase().includes(q) || u.primaryEmail.toLowerCase().includes(q)
          )
        : MOCK_DIRECTORY_USERS,
    });
  }
  if (url.includes("/people:searchDirectoryPeople")) {
    return jsonRes({
      people: MOCK_DIRECTORY_USERS.map((u) => ({
        names: [{ displayName: u.name.fullName }],
        emailAddresses: [{ value: u.primaryEmail }],
      })),
    });
  }
  if (url.includes("/freeBusy")) {
    const items = (bodyObj.items as Array<{ id: string }>) || [];
    const calendars: Record<string, { busy: Array<{ start: string; end: string }> }> = {};
    for (const item of items) calendars[item.id] = { busy: [] };
    return jsonRes({ calendars });
  }
  if (url.includes("/calendarList")) {
    return jsonRes({ items: [] });
  }
  if (url.includes("/events")) {
    return handleEventMutation(url, method, bodyObj);
  }
  if (url.includes("/calendars/")) {
    const calId = url.split("/calendars/")[1]?.split("?")[0] || "primary";
    return jsonRes({ id: calId, summary: `Calendar ${calId}` });
  }
  return jsonRes({ items: [] });
}
