import { CalendarEventTracker, GCalAuthService } from "./gcal-auth-service";
import {
  type CalendarEventResult,
  type CreateEventInput,
  type DeleteEventResult,
  type UpdateEventInput,
  normalizeAttendees,
  toIsoString,
} from "./gcal-types";

export class GCalEventMutationService {
  public static async createEvent(
    payload: CreateEventInput,
    accessToken?: string,
  ): Promise<CalendarEventResult> {
    const summary = payload.summary || payload.title || "Scheduled Meeting";
    const startIso = toIsoString(payload.start);
    const endIso = toIsoString(payload.end);
    const calendarId = payload.calendarId || "primary";
    const attendees = normalizeAttendees(payload.attendees, payload.roomEmail);
    const token = await GCalAuthService.getAccessToken(
      accessToken || payload.accessToken,
    );

    if (!token) {
      throw new Error(
        "Google Calendar API access token is required to create an event",
      );
    }

    const gcalPayload: Record<string, unknown> = {
      summary,
      description: payload.description,
      start: { dateTime: startIso },
      end: { dateTime: endIso },
      attendees: attendees.map((a) => ({
        email: a.email,
        displayName: a.name,
        resource: a.resource,
      })),
    };

    if (payload.conference !== false) {
      const confReqId =
        (payload as { conferenceRequestId?: string }).conferenceRequestId ||
        `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      gcalPayload.conferenceData = {
        createRequest: {
          requestId: confReqId,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      };
    }

    const res = await GCalAuthService.fetchWithMock(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId,
      )}/events?conferenceDataVersion=1`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gcalPayload),
      },
    );

    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data?.error?.message || JSON.stringify(data);
      throw new Error(`Google Calendar createEvent failed: ${errorMsg}`);
    }

    const meetingUrl =
      data.hangoutLink || data.conferenceData?.entryPoints?.[0]?.uri;

    const result: CalendarEventResult = {
      id: String(data.id || ""),
      status: String(data.status || "confirmed"),
      summary: data.summary ? String(data.summary) : undefined,
      description: data.description ? String(data.description) : undefined,
      meetingUrl: meetingUrl || undefined,
      hangoutsLink: data.hangoutLink ? String(data.hangoutLink) : undefined,
      htmlLink: data.htmlLink ? String(data.htmlLink) : undefined,
      start: { dateTime: data.start?.dateTime || startIso },
      end: { dateTime: data.end?.dateTime || endIso },
      attendees: ((data.attendees || []) as Array<Record<string, unknown>>).map(
        (a) => ({
          email: String(a.email || ""),
          name: a.displayName ? String(a.displayName) : undefined,
          responseStatus: a.responseStatus
            ? String(a.responseStatus)
            : undefined,
          resource: Boolean(a.resource),
        }),
      ),
      roomEmail: payload.roomEmail,
    };

    CalendarEventTracker.track(result.id);
    return result;
  }

  public static async updateEvent(
    eventId: string,
    payload: UpdateEventInput,
    accessToken?: string,
  ): Promise<CalendarEventResult> {
    const calendarId = payload.calendarId || "primary";
    const token = await GCalAuthService.getAccessToken(
      accessToken || payload.accessToken,
    );

    if (!token) {
      throw new Error(
        "Google Calendar API access token is required to update an event",
      );
    }

    const gcalPayload: Record<string, unknown> = {};

    if (payload.summary || payload.title) {
      gcalPayload.summary = payload.summary || payload.title;
    }
    if (payload.description !== undefined) {
      gcalPayload.description = payload.description;
    }
    if (payload.start) {
      gcalPayload.start = { dateTime: toIsoString(payload.start) };
    }
    if (payload.end) {
      gcalPayload.end = { dateTime: toIsoString(payload.end) };
    }
    if (payload.attendees) {
      gcalPayload.attendees = normalizeAttendees(
        payload.attendees,
        payload.roomEmail,
      ).map((a) => ({
        email: a.email,
        displayName: a.name,
        resource: a.resource,
      }));
    } else if (payload.roomEmail) {
      gcalPayload.attendees = [{ email: payload.roomEmail, resource: true }];
    }

    const res = await GCalAuthService.fetchWithMock(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId,
      )}/events/${encodeURIComponent(eventId)}?conferenceDataVersion=1`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gcalPayload),
      },
    );

    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data?.error?.message || JSON.stringify(data);
      console.warn("Google Calendar updateEvent failed:", errorMsg);
      throw new Error(`Google Calendar updateEvent failed: ${errorMsg}`);
    }

    const meetingUrl =
      data.hangoutLink || data.conferenceData?.entryPoints?.[0]?.uri;

    return {
      id: String(data.id || ""),
      status: String(data.status || "confirmed"),
      summary: data.summary ? String(data.summary) : undefined,
      description: data.description ? String(data.description) : undefined,
      meetingUrl: meetingUrl || undefined,
      hangoutsLink: data.hangoutLink ? String(data.hangoutLink) : undefined,
      htmlLink: data.htmlLink ? String(data.htmlLink) : undefined,
      start: { dateTime: data.start?.dateTime || "" },
      end: { dateTime: data.end?.dateTime || "" },
      attendees: ((data.attendees || []) as Array<Record<string, unknown>>).map(
        (a) => ({
          email: String(a.email || ""),
          name: a.displayName ? String(a.displayName) : undefined,
          responseStatus: a.responseStatus
            ? String(a.responseStatus)
            : undefined,
          resource: Boolean(a.resource),
        }),
      ),
      roomEmail: payload.roomEmail,
    };
  }

  public static async deleteEvent(
    eventId: string,
    calendarId: string = "primary",
    accessToken?: string,
  ): Promise<DeleteEventResult> {
    const token = await GCalAuthService.getAccessToken(accessToken);

    if (!token) {
      throw new Error(
        "Google Calendar API access token is required to delete an event",
      );
    }

    const res = await GCalAuthService.fetchWithMock(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId,
      )}/events/${encodeURIComponent(eventId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok && res.status !== 404) {
      const err = await res.text();
      throw new Error(`Google Calendar deleteEvent failed: ${err}`);
    }

    CalendarEventTracker.untrack(eventId);
    return { success: true, id: eventId };
  }
}
