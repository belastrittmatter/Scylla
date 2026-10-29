import { GoogleCalendarService } from "@/services/google-calendar";
import { SchedulerService } from "@/services/scheduler";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  account,
  booking,
  user,
  meetingRoom,
  project,
  team,
} from "@/db/schema";
import { eq, or, inArray } from "drizzle-orm";
import { reconcileDeletedGoogleEvents } from "@/utils/calendar-sync-reconciler";

export interface UnifiedCalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  meetingUrl?: string;
  start: string;
  end: string;
  color?: string;
  status?: string;
  category?: "all" | "shared" | "public" | "archived";
  attendees?: Array<{
    name?: string;
    email: string;
    avatar?: string;
    role?: string;
  }>;
  source?: "google" | "db";
  organizer?: { id?: string; name?: string; email?: string; avatar?: string };
  roomDetails?: {
    id?: string;
    name?: string;
    building?: string;
    floor?: string;
    capacity?: number;
    equipment?: string[];
  };
  projectId?: string;
  project?: {
    id: string;
    name: string;
    slug: string;
    color?: string | null;
    teamId: string;
    teamSlug?: string;
  };
}

const ATTENDEE_COLORS = [
  "#e11d48", // rose-600
  "#8b5cf6", // violet-500
  "#d97706", // amber-600
  "#059669", // emerald-600
  "#0891b2", // cyan-600
  "#7c3aed", // violet-600
  "#db2777", // pink-600
  "#4f46e5", // indigo-600
];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const timeMinParam = url.searchParams.get("timeMin");
    const timeMaxParam = url.searchParams.get("timeMax");
    const requestedUserId = url.searchParams.get("userId") || undefined;
    const attendeeEmailsParam = url.searchParams.get("attendeeEmails");

    let sessionUserId: string | undefined;
    let sessionUserEmail: string | undefined;

    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (session?.user) {
        sessionUserId = session.user.id;
        sessionUserEmail = session.user.email;
      }
    } catch {
      // Ignore session retrieval error if unauthenticated
    }

    const activeUserId = requestedUserId || sessionUserId;

    // Resolve user's schedule, Google account OAuth credentials, and DB catalog/bookings in parallel
    const [scheduleInfo, googleAccount, dbData] = await Promise.all([
      SchedulerService.getUserSchedule(activeUserId || sessionUserEmail),
      (async () => {
        let acct = null;
        if (activeUserId) {
          const accounts = await db
            .select()
            .from(account)
            .where(eq(account.userId, activeUserId));
          acct = accounts.find((a) => a.providerId === "google") || null;
        }
        if (!acct) {
          const anyGoogleAccounts = await db
            .select()
            .from(account)
            .where(eq(account.providerId, "google"))
            .limit(1);
          if (anyGoogleAccounts.length > 0) {
            acct = anyGoogleAccounts[0];
          }
        }
        return acct;
      })(),
      Promise.all([
        db.select().from(meetingRoom),
        db.select().from(user),
        activeUserId
          ? db
              .select()
              .from(booking)
              .where(
                or(
                  eq(booking.organizerUserId, activeUserId),
                  eq(booking.userId, activeUserId),
                ),
              )
          : db.select().from(booking).limit(50),
      ]).catch((dbErr) => {
        console.warn("Failed to fetch DB bookings for calendar:", dbErr);
        return null;
      }),
    ]);

    const isOfficeOrWorkingLocation = (
      summary?: string,
      eventType?: string,
    ) => {
      if (eventType === "workingLocation") return true;
      if (!summary) return false;
      const s = summary.toLowerCase();
      return (
        s.includes("(office)") ||
        s.includes("(home)") ||
        s.includes("(remote)") ||
        s.startsWith("working from") ||
        s.includes("working location")
      );
    };

    // Default time range: start of current month to 60 days ahead
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    const defaultMin = startOfMonth.toISOString();
    const defaultMax = new Date(
      now.getTime() + 60 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const timeMin = timeMinParam || defaultMin;
    const timeMax = timeMaxParam || defaultMax;

    // Filter attendee emails (excluding current active user's own email)
    const attendeeEmails = (attendeeEmailsParam || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && e !== sessionUserEmail?.toLowerCase());

    const unifiedEvents: UnifiedCalendarEvent[] = [];
    const seenEventIds = new Set<string>();
    const gcalCancelledIds = new Set<string>();
    let gcalFetchSucceeded = false;

    // Pre-resolve display names and resource type for attendees from DB first, then Google Workspace fallback
    const attendeeMetaMap = new Map<
      string,
      { name: string; isResource: boolean; details?: string }
    >();

    if (dbData) {
      const [dbRooms, dbUsers] = dbData;
      for (const r of dbRooms) {
        if (r.email) {
          attendeeMetaMap.set(r.email.toLowerCase(), {
            name: r.name,
            isResource: true,
            details: r.description || undefined,
          });
        }
        if (r.googleResourceEmail) {
          attendeeMetaMap.set(r.googleResourceEmail.toLowerCase(), {
            name: r.name,
            isResource: true,
            details: r.description || undefined,
          });
        }
      }
      for (const u of dbUsers) {
        attendeeMetaMap.set(u.email.toLowerCase(), {
          name: u.name,
          isResource: false,
          details: u.role || undefined,
        });
      }
    }

    if (attendeeEmails.length > 0) {
      await Promise.all(
        attendeeEmails.map(async (em) => {
          const lowerEm = em.toLowerCase();
          if (attendeeMetaMap.has(lowerEm)) return;
          const info = await GoogleCalendarService.resolveAttendeeInfo(em, {
            accountRecord: googleAccount || undefined,
            accessToken: googleAccount?.accessToken || undefined,
          });
          attendeeMetaMap.set(lowerEm, info);
        }),
      );
    }

    // 1. Fetch live Google Calendar events (primary, attendee calendars, and free/busy) in parallel
    if (googleAccount) {
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

      if (primaryResult.ok) {
        gcalFetchSucceeded = true;

        for (const ge of primaryResult.events) {
          if (ge.status === "cancelled") {
            gcalCancelledIds.add(ge.id);
            gcalCancelledIds.add(`gcal-${ge.id}`);
            continue;
          }

          if (!ge.start?.dateTime || !ge.end?.dateTime) continue;

          // Filter out working location status events and transparent all-day events
          if (isOfficeOrWorkingLocation(ge.summary, ge.eventType)) continue;
          if (ge.transparency === "transparent" && ge.isAllDay) continue;

          seenEventIds.add(ge.id);
          seenEventIds.add(`gcal-${ge.id}`);

          unifiedEvents.push({
            id: `gcal-${ge.id}`,
            title: ge.summary || "Scheduled Event",
            description: ge.description,
            location:
              ge.location || (ge.meetingUrl ? "Google Meet" : undefined),
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

      // 1b. Process events fetched directly for attendee calendars
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

          // Skip working locations, office statuses, and transparent events
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

          // Skip if an event at this exact time already exists and covers this attendee or has matching title
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
                existing.title
                  .toLowerCase()
                  .includes(ge.summary.toLowerCase()) ||
                ge.summary
                  .toLowerCase()
                  .includes(existing.title.toLowerCase()));

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

          const title = ge.summary
            ? `${meta.name}: ${ge.summary}`
            : meta.isResource
              ? `${meta.name} (Occupied)`
              : `Busy: ${meta.name}`;

          const description = ge.description
            ? ge.description
            : meta.isResource
              ? `Reserved meeting room: ${meta.name} (${attendeeEmail})`
              : `Busy schedule for ${meta.name} (${attendeeEmail})`;

          unifiedEvents.push({
            id: eventId,
            title,
            description,
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
                : [
                    {
                      name: meta.name,
                      email: attendeeEmail,
                    },
                  ],
            source: "google",
          });
        }
      }

      // 1c. Process Free/Busy blocks for selected attendees / rooms across the organization
      if (freeBusyResult) {
        let emailIndex = 0;
        for (const [attendeeEmail, intervals] of Object.entries(
          freeBusyResult,
        )) {
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

            // Ignore 24h+ intervals (all-day status blocks that might leak from free/busy)
            if (intEndMs - intStartMs >= 24 * 60 * 60 * 1000) continue;

            const eventId = `busy-${attendeeEmail}-${interval.start}`;
            if (seenEventIds.has(eventId)) continue;

            // Check if we already have an event covering this interval for this attendee (using timestamp millisecond comparison)
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

            const title = meta.isResource
              ? `${meta.name} (Occupied)`
              : `Busy: ${meta.name}`;

            const description = meta.isResource
              ? `Reserved meeting room: ${meta.name}${
                  meta.details ? ` • ${meta.details}` : ""
                } (${attendeeEmail})`
              : `Busy schedule for ${meta.name} (${attendeeEmail})`;

            unifiedEvents.push({
              id: eventId,
              title,
              description,
              location: meta.isResource ? meta.name : undefined,
              start: interval.start,
              end: interval.end,
              color,
              status: "busy",
              category: "shared",
              attendees: [
                {
                  name: meta.name,
                  email: attendeeEmail,
                },
              ],
              source: "google",
            });
          }
          emailIndex++;
        }
      }
    }

    // 2. Process DB confirmed bookings for active user
    if (dbData) {
      try {
        const [dbRooms, dbUsers, dbBookings] = dbData;
        const roomMap = new Map(dbRooms.map((r) => [r.id, r]));
        const userMap = new Map(dbUsers.map((u) => [u.id, u]));

        // Extract referenced project IDs and fetch only necessary project & team info
        const projectIds = Array.from(
          new Set(
            dbBookings
              .map((b) => b.projectId)
              .filter((id): id is string => Boolean(id)),
          ),
        );

        const dbProjects =
          projectIds.length > 0
            ? await db
                .select({
                  id: project.id,
                  name: project.name,
                  slug: project.slug,
                  color: project.color,
                  teamId: project.teamId,
                  teamSlug: team.slug,
                })
                .from(project)
                .leftJoin(team, eq(project.teamId, team.id))
                .where(inArray(project.id, projectIds))
            : [];

        const projectMap = new Map(dbProjects.map((p) => [p.id, p]));

        // Reconcile deleted Google Calendar events if live Google fetch succeeded
        let newlyCancelledBookingIds = new Set<string>();
        if (googleAccount && gcalFetchSucceeded) {
          const eligibleBookings = dbBookings.filter(
            (b) =>
              !b.organizerUserId || b.organizerUserId === googleAccount.userId,
          );
          newlyCancelledBookingIds = await reconcileDeletedGoogleEvents({
            bookings: eligibleBookings,
            activeGcalIds: seenEventIds,
            cancelledGcalIds: gcalCancelledIds,
            timeMinIso: timeMin,
            timeMaxIso: timeMax,
          });
        }

        for (const b of dbBookings) {
          if (newlyCancelledBookingIds.has(b.id)) {
            b.status = "cancelled";
          }

          const bGcalId = b.gcalEventId || b.googleEventId;
          const bStartMs = new Date(b.startTime).getTime();
          const bEndMs = new Date(b.endTime).getTime();

          const room = b.roomId ? roomMap.get(b.roomId) : undefined;
          const orgUser = b.organizerUserId
            ? userMap.get(b.organizerUserId)
            : undefined;
          const locationName =
            room?.name || (b.meetingUrl ? "Google Meet" : undefined);
          const roomDetails = room
            ? {
                id: room.id,
                name: room.name,
                building: room.building || undefined,
                floor: room.floor || undefined,
                capacity: room.capacity,
                equipment: [
                  ...(Array.isArray(room.equipment) ? room.equipment : []),
                  ...(Array.isArray(room.features) ? room.features : []),
                ],
              }
            : undefined;
          const organizer = orgUser
            ? {
                id: orgUser.id,
                name: orgUser.name,
                email: orgUser.email,
                avatar: orgUser.image || undefined,
              }
            : undefined;

          const attendeesRaw = Array.isArray(b.attendees) ? b.attendees : [];
          const enrichedAttendees = (
            attendeesRaw as Array<{ name?: string; email: string }>
          ).map((a) => {
            const matchedUser = dbUsers.find(
              (u) => u.email.toLowerCase() === a.email.toLowerCase(),
            );
            return {
              name: a.name || matchedUser?.name || a.email.split("@")[0],
              email: a.email,
              avatar: matchedUser?.image || undefined,
              role: matchedUser ? "Member" : "Guest",
            };
          });

          const proj = b.projectId ? projectMap.get(b.projectId) : undefined;
          const projectDetails = proj
            ? {
                id: proj.id,
                name: proj.name,
                slug: proj.slug,
                color: proj.color || undefined,
                teamId: proj.teamId,
                teamSlug: proj.teamSlug || undefined,
              }
            : undefined;

          // Check if an event in unifiedEvents already matches this booking
          const existingIdx = unifiedEvents.findIndex((ev) => {
            // 1. Direct ID match
            if (ev.id === b.id) return true;
            if (bGcalId) {
              if (ev.id === bGcalId || ev.id === `gcal-${bGcalId}`) return true;
              if (ev.id.replace(/^gcal-/, "") === bGcalId) return true;
            }
            // 2. Fuzzy Time & Title / MeetingURL match (within 60s)
            const evStartMs = new Date(ev.start).getTime();
            const evEndMs = new Date(ev.end).getTime();
            const isTimeMatch =
              Math.abs(evStartMs - bStartMs) < 60000 &&
              Math.abs(evEndMs - bEndMs) < 60000;

            if (isTimeMatch) {
              const evTitle = (ev.title || "").trim().toLowerCase();
              const bTitle = (b.title || "").trim().toLowerCase();
              if (
                evTitle === bTitle ||
                evTitle.includes(bTitle) ||
                bTitle.includes(evTitle)
              ) {
                return true;
              }
              if (
                b.meetingUrl &&
                ev.meetingUrl &&
                b.meetingUrl === ev.meetingUrl
              ) {
                return true;
              }
            }
            return false;
          });

          if (existingIdx !== -1) {
            // Found duplicate between DB booking and Google Calendar event!
            // If the booking was cancelled in DB, don't show it as an active calendar event
            if (b.status === "cancelled") {
              unifiedEvents.splice(existingIdx, 1);
              continue;
            }

            // MERGE: Keep only ONE unified event, using the DB booking ID and enriched fields
            const existing = unifiedEvents[existingIdx];
            unifiedEvents[existingIdx] = {
              ...existing,
              id: b.id, // CRITICAL: Use DB booking ID so user can edit/cancel via DB
              title: b.title || existing.title,
              description: b.description || existing.description,
              location: locationName || existing.location,
              meetingUrl:
                b.meetingUrl || b.googleMeetUrl || existing.meetingUrl,
              status: b.status || existing.status,
              roomDetails: roomDetails || existing.roomDetails,
              organizer: organizer || existing.organizer,
              attendees:
                enrichedAttendees.length > 0
                  ? enrichedAttendees
                  : existing.attendees,
              projectId: b.projectId || undefined,
              project: projectDetails,
              color: projectDetails?.color || "#2563eb",
              source: "db",
            };
            seenEventIds.add(b.id);
            if (bGcalId) {
              seenEventIds.add(bGcalId);
              seenEventIds.add(`gcal-${bGcalId}`);
            }
          } else {
            // If not existing yet and not cancelled, add DB booking
            if (b.status === "cancelled") continue;

            unifiedEvents.push({
              id: b.id,
              title: b.title,
              description: b.description || undefined,
              location: locationName,
              meetingUrl: b.meetingUrl || b.googleMeetUrl || undefined,
              start: new Date(b.startTime).toISOString(),
              end: new Date(b.endTime).toISOString(),
              color: projectDetails?.color || "#2563eb",
              status: b.status,
              category: "all",
              attendees: enrichedAttendees,
              organizer,
              roomDetails,
              projectId: b.projectId || undefined,
              project: projectDetails,
              source: "db",
            });
            seenEventIds.add(b.id);
            if (bGcalId) {
              seenEventIds.add(bGcalId);
              seenEventIds.add(`gcal-${bGcalId}`);
            }
          }
        }
      } catch (dbErr) {
        console.warn("Failed to fetch DB bookings for calendar:", dbErr);
      }
    }

    return Response.json(
      {
        events: unifiedEvents,
        workingHours: scheduleInfo.workingHours,
        timeZone: scheduleInfo.timeZone,
        googleConnected: Boolean(
          googleAccount?.accessToken || googleAccount?.refreshToken,
        ),
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch calendar events",
      },
      { status: 500 },
    );
  }
}
