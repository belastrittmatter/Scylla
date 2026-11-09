import { GoogleCalendarService } from "@/services/google-calendar";
import { processAttendeeCalendarSync } from "./calendar-attendee-sync";
import {
  type UnifiedCalendarEvent,
  isOfficeOrWorkingLocation,
} from "./calendar-types";
import type { account } from "@/db/schema";

interface GoogleSyncParams {
  googleAccount: typeof account.$inferSelect | null;
  timeMin: string;
  timeMax: string;
  attendeeEmails: string[];
  attendeeMetaMap: Map<
    string,
    { name: string; isResource: boolean; details?: string }
  >;
  unifiedEvents: UnifiedCalendarEvent[];
  seenEventIds: Set<string>;
  gcalCancelledIds: Set<string>;
}

export async function processGoogleCalendarSync(
  params: GoogleSyncParams,
): Promise<{ gcalFetchSucceeded: boolean }> {
  const {
    googleAccount,
    timeMin,
    timeMax,
    attendeeEmails,
    attendeeMetaMap,
    unifiedEvents,
    seenEventIds,
    gcalCancelledIds,
  } = params;

  if (!googleAccount) {
    return { gcalFetchSucceeded: false };
  }

  const [primaryResult, attendeeEventsResults, freeBusyResult] =
    await Promise.all([
      GoogleCalendarService.listEvents("primary", {
        accountRecord: googleAccount,
        accessToken: googleAccount.accessToken || undefined,
        timeMin,
        timeMax,
        maxResults: 100,
        showDeleted: true,
      })
        .then((events) => ({ ok: true as const, events }))
        .catch((gcalErr) => {
          console.warn("Failed to fetch Google Calendar events:", gcalErr);
          return { ok: false as const, events: [] };
        }),
      Promise.all(
        attendeeEmails.map((attendeeEmail) =>
          GoogleCalendarService.listEvents(attendeeEmail, {
            accountRecord: googleAccount,
            accessToken: googleAccount.accessToken || undefined,
            timeMin,
            timeMax,
            maxResults: 100,
          }).catch(() => null),
        ),
      ),
      attendeeEmails.length > 0
        ? GoogleCalendarService.getFreeBusy(
            attendeeEmails,
            new Date(timeMin),
            new Date(timeMax),
            {
              accountRecord: googleAccount,
              accessToken: googleAccount.accessToken || undefined,
            },
          ).catch((fbErr) => {
            console.warn(
              "Failed to fetch Google Calendar free/busy for attendees:",
              fbErr,
            );
            return null;
          })
        : Promise.resolve(null),
    ]);

  let gcalFetchSucceeded = false;

  if (primaryResult.ok) {
    gcalFetchSucceeded = true;

    for (const ge of primaryResult.events) {
      if (ge.status === "cancelled") {
        gcalCancelledIds.add(ge.id);
        gcalCancelledIds.add(`gcal-${ge.id}`);
        continue;
      }

      // CRITICAL: Register seen event IDs before any display filtering (working location, transparent)
      // so active Google events are never marked as deleted in the reconciler.
      seenEventIds.add(ge.id);
      seenEventIds.add(`gcal-${ge.id}`);

      if (!ge.start?.dateTime || !ge.end?.dateTime) continue;

      // Filter out working location status events and transparent all-day events from display
      if (isOfficeOrWorkingLocation(ge.summary, ge.eventType)) continue;
      if (ge.transparency === "transparent" && ge.isAllDay) continue;

      unifiedEvents.push({
        id: `gcal-${ge.id}`,
        title: ge.summary || "Scheduled Event",
        description: ge.description,
        location: ge.location || (ge.meetingUrl ? "Google Meet" : undefined),
        meetingUrl: ge.meetingUrl || ge.hangoutsLink,
        start: ge.start.dateTime,
        end: ge.end.dateTime,
        color: "#0284c7",
        status: ge.status,
        category: "shared",
        attendees: ge.attendees.map((a) => ({
          name:
            a.name ||
            attendeeMetaMap.get(a.email.toLowerCase())?.name ||
            a.email.split("@")[0],
          email: a.email,
        })),
        source: "google",
      });
    }
  }

  processAttendeeCalendarSync({
    attendeeEmails,
    attendeeEventsResults,
    freeBusyResult,
    attendeeMetaMap,
    unifiedEvents,
    seenEventIds,
  });

  return { gcalFetchSucceeded };
}
