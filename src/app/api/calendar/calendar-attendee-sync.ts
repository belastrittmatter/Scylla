import {
  ATTENDEE_COLORS,
  type UnifiedCalendarEvent,
  isOfficeOrWorkingLocation,
} from "./calendar-types";
import type { CalendarEventResult } from "@/services/google-calendar";

interface AttendeeSyncParams {
  attendeeEmails: string[];
  attendeeEventsResults: Array<CalendarEventResult[] | null>;
  freeBusyResult: Record<string, Array<{ start: string; end: string }>> | null;
  attendeeMetaMap: Map<
    string,
    { name: string; isResource: boolean; details?: string }
  >;
  unifiedEvents: UnifiedCalendarEvent[];
  seenEventIds: Set<string>;
}

export function processAttendeeCalendarSync(params: AttendeeSyncParams): void {
  const {
    attendeeEmails,
    attendeeEventsResults,
    freeBusyResult,
    attendeeMetaMap,
    unifiedEvents,
    seenEventIds,
  } = params;

  for (let i = 0; i < attendeeEmails.length; i++) {
    const attendeeEmail = attendeeEmails[i];
    const attendeeGcalEvents = attendeeEventsResults[i];
    if (!attendeeGcalEvents) continue;

    const meta = attendeeMetaMap.get(attendeeEmail.toLowerCase()) || {
      name: attendeeEmail.split("@")[0],
      isResource: false,
    };
    const color = ATTENDEE_COLORS[i % ATTENDEE_COLORS.length];

    for (const ge of attendeeGcalEvents) {
      if (!ge.start?.dateTime || !ge.end?.dateTime) continue;
      if (isOfficeOrWorkingLocation(ge.summary, ge.eventType)) continue;
      if (ge.transparency === "transparent") continue;
      if (ge.isAllDay && !meta.isResource) continue;

      const eventId = `attendee-${attendeeEmail}-${ge.id}`;
      if (
        seenEventIds.has(eventId) ||
        seenEventIds.has(ge.id) ||
        seenEventIds.has(`gcal-${ge.id}`)
      ) {
        continue;
      }

      const geStartMs = new Date(ge.start.dateTime).getTime();
      const geEndMs = new Date(ge.end.dateTime).getTime();

      const duplicateEvent = unifiedEvents.find((existing) => {
        const exStartMs = new Date(existing.start).getTime();
        const exEndMs = new Date(existing.end).getTime();
        const timeMatches =
          Math.abs(exStartMs - geStartMs) < 60000 &&
          Math.abs(exEndMs - geEndMs) < 60000;
        if (!timeMatches) return false;

        const attendeeMatch = existing.attendees?.some(
          (a) => a.email.toLowerCase() === attendeeEmail.toLowerCase(),
        );
        const titleMatch =
          ge.summary &&
          (existing.title === ge.summary ||
            existing.title.toLowerCase().includes(ge.summary.toLowerCase()) ||
            ge.summary.toLowerCase().includes(existing.title.toLowerCase()));

        return attendeeMatch || titleMatch;
      });

      if (duplicateEvent) {
        if (
          !duplicateEvent.attendees?.some(
            (a) => a.email.toLowerCase() === attendeeEmail.toLowerCase(),
          )
        ) {
          duplicateEvent.attendees = [
            ...(duplicateEvent.attendees || []),
            { name: meta.name, email: attendeeEmail },
          ];
        }
        seenEventIds.add(eventId);
        seenEventIds.add(ge.id);
        continue;
      }

      seenEventIds.add(eventId);
      seenEventIds.add(ge.id);

      unifiedEvents.push({
        id: eventId,
        title: ge.summary
          ? `${meta.name}: ${ge.summary}`
          : meta.isResource
            ? `${meta.name} (Occupied)`
            : `Busy: ${meta.name}`,
        description: ge.description
          ? ge.description
          : meta.isResource
            ? `Reserved meeting room: ${meta.name} (${attendeeEmail})`
            : `Busy schedule for ${meta.name} (${attendeeEmail})`,
        location: ge.location || (meta.isResource ? meta.name : undefined),
        meetingUrl: ge.meetingUrl || ge.hangoutsLink,
        start: ge.start.dateTime,
        end: ge.end.dateTime,
        color,
        status: ge.status || "busy",
        category: "shared",
        attendees:
          ge.attendees.length > 0
            ? ge.attendees.map((a) => ({
                name:
                  a.name ||
                  attendeeMetaMap.get(a.email.toLowerCase())?.name ||
                  a.email.split("@")[0],
                email: a.email,
              }))
            : [{ name: meta.name, email: attendeeEmail }],
        source: "google",
      });
    }
  }

  if (freeBusyResult) {
    let emailIndex = 0;
    for (const [attendeeEmail, intervals] of Object.entries(freeBusyResult)) {
      if (!Array.isArray(intervals)) continue;
      const color = ATTENDEE_COLORS[emailIndex % ATTENDEE_COLORS.length];
      const lowerEmail = attendeeEmail.toLowerCase();
      const meta = attendeeMetaMap.get(lowerEmail) || {
        name: attendeeEmail.split("@")[0],
        isResource:
          lowerEmail.includes("resource.calendar.google.com") ||
          lowerEmail.includes("meetingroom"),
      };

      for (const interval of intervals) {
        const intStartMs = new Date(interval.start).getTime();
        const intEndMs = new Date(interval.end).getTime();

        if (isNaN(intStartMs) || isNaN(intEndMs) || intStartMs >= intEndMs)
          continue;
        if (intEndMs - intStartMs >= 24 * 60 * 60 * 1000) continue;

        const eventId = `busy-${attendeeEmail}-${interval.start}`;
        if (seenEventIds.has(eventId)) continue;

        const alreadyCovered = unifiedEvents.some((ev) => {
          const matchesAttendee = ev.attendees?.some(
            (a) => a.email.toLowerCase() === lowerEmail,
          );
          if (!matchesAttendee) return false;

          const evStartMs = new Date(ev.start).getTime();
          const evEndMs = new Date(ev.end).getTime();

          return (
            Math.abs(evStartMs - intStartMs) < 60000 &&
            Math.abs(evEndMs - intEndMs) < 60000
          );
        });

        if (alreadyCovered) continue;
        seenEventIds.add(eventId);

        unifiedEvents.push({
          id: eventId,
          title: meta.isResource
            ? `${meta.name} (Occupied)`
            : `Busy: ${meta.name}`,
          description: meta.isResource
            ? `Reserved meeting room: ${meta.name}${meta.details ? ` • ${meta.details}` : ""} (${attendeeEmail})`
            : `Busy schedule for ${meta.name} (${attendeeEmail})`,
          location: meta.isResource ? meta.name : undefined,
          start: interval.start,
          end: interval.end,
          color,
          status: "busy",
          category: "shared",
          attendees: [{ name: meta.name, email: attendeeEmail }],
          source: "google",
        });
      }
      emailIndex++;
    }
  }
}
