export interface ResourceRoom {
  id: string;
  name: string;
  email: string;
  capacity: number;
  features: string[];
  building?: string;
  floor?: string;
  description?: string;
  officeLocation?: string;
}

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  title?: string;
  department?: string;
}

export interface FreeBusyInterval {
  start: string;
  end: string;
}

export interface CreateEventInput {
  title?: string;
  summary?: string;
  description?: string;
  start: Date | string;
  end: Date | string;
  attendees?: Array<
    string | { email: string; name?: string; responseStatus?: string }
  >;
  roomEmail?: string;
  calendarId?: string;
  conference?: boolean;
  accessToken?: string;
  conferenceRequestId?: string;
}

export interface UpdateEventInput {
  title?: string;
  summary?: string;
  description?: string;
  start?: Date | string;
  end?: Date | string;
  attendees?: Array<
    string | { email: string; name?: string; responseStatus?: string }
  >;
  roomEmail?: string;
  calendarId?: string;
  accessToken?: string;
}

export interface CalendarEventAttendee {
  email: string;
  name?: string;
  responseStatus?: string;
  resource?: boolean;
}

export interface CalendarEventResult {
  id: string;
  status: string;
  summary?: string;
  description?: string;
  location?: string;
  meetingUrl?: string;
  hangoutsLink?: string;
  htmlLink?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  attendees: CalendarEventAttendee[];
  roomEmail?: string;
  transparency?: string;
  eventType?: string;
  isAllDay?: boolean;
}

export interface DeleteEventResult {
  success: boolean;
  id: string;
}

export type GCalAccountRecord = {
  id?: string;
  refreshToken?: string | null;
  accessToken?: string | null;
  accessTokenExpiresAt?: Date | null;
  [key: string]: unknown;
};

export function toIsoString(val: Date | string): string {
  if (val instanceof Date) return val.toISOString();
  return new Date(val).toISOString();
}

export function normalizeAttendees(
  attendees?: Array<
    string | { email: string; name?: string; responseStatus?: string }
  >,
  roomEmail?: string,
): CalendarEventAttendee[] {
  const result: CalendarEventAttendee[] = [];
  const seen = new Set<string>();

  if (attendees) {
    for (const a of attendees) {
      if (typeof a === "string") {
        const email = a.trim();
        if (email && !seen.has(email)) {
          seen.add(email);
          result.push({ email, responseStatus: "needsAction" });
        }
      } else if (a && a.email) {
        const email = a.email.trim();
        if (email && !seen.has(email)) {
          seen.add(email);
          result.push({
            email,
            name: a.name,
            responseStatus: a.responseStatus || "needsAction",
          });
        }
      }
    }
  }

  if (roomEmail) {
    const trimmedRoom = roomEmail.trim();
    if (trimmedRoom && !seen.has(trimmedRoom)) {
      seen.add(trimmedRoom);
      result.push({
        email: trimmedRoom,
        resource: true,
        responseStatus: "accepted",
      });
    }
  }

  return result;
}
