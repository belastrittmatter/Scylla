import { db } from "@/db";
import { booking, meetingRoom, project, team, user } from "@/db/schema";
import { reconcileDeletedGoogleEvents } from "@/utils/calendar-sync-reconciler";
import { eq, inArray } from "drizzle-orm";
import type { UnifiedCalendarEvent } from "./calendar-types";

interface DbSyncParams {
  dbData:
    | [
        Array<typeof meetingRoom.$inferSelect>,
        Array<typeof user.$inferSelect>,
        Array<typeof booking.$inferSelect>,
      ]
    | null;
  googleAccount: { userId?: string } | null;
  gcalFetchSucceeded: boolean;
  timeMin: string;
  timeMax: string;
  seenEventIds: Set<string>;
  gcalCancelledIds: Set<string>;
  unifiedEvents: UnifiedCalendarEvent[];
}

export async function processDbCalendarSync(
  params: DbSyncParams,
): Promise<void> {
  const {
    dbData,
    googleAccount,
    gcalFetchSucceeded,
    timeMin,
    timeMax,
    seenEventIds,
    gcalCancelledIds,
    unifiedEvents,
  } = params;

  if (!dbData) return;

  const [dbRooms, dbUsers, dbBookings] = dbData;
  const roomMap = new Map(dbRooms.map((r) => [r.id, r]));
  const userMap = new Map(dbUsers.map((u) => [u.id, u]));

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

  // Reconcile deleted Google Calendar events ONLY if live Google fetch succeeded
  let newlyCancelledBookingIds = new Set<string>();
  if (googleAccount && gcalFetchSucceeded) {
    const eligibleBookings = dbBookings.filter(
      (b) => !b.organizerUserId || b.organizerUserId === googleAccount.userId,
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

    const existingIdx = unifiedEvents.findIndex((ev) => {
      if (ev.id === b.id) return true;
      if (bGcalId) {
        if (ev.id === bGcalId || ev.id === `gcal-${bGcalId}`) return true;
        if (ev.id.replace(/^gcal-/, "") === bGcalId) return true;
      }
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
        if (b.meetingUrl && ev.meetingUrl && b.meetingUrl === ev.meetingUrl) {
          return true;
        }
      }
      return false;
    });

    if (existingIdx !== -1) {
      if (b.status === "cancelled") {
        unifiedEvents.splice(existingIdx, 1);
        continue;
      }

      const seriesMatch = b.description?.match(
        /<!--series:([a-zA-Z0-9_-]+)-->/,
      );
      const seriesId = seriesMatch ? seriesMatch[1] : undefined;

      const existing = unifiedEvents[existingIdx];
      unifiedEvents[existingIdx] = {
        ...existing,
        id: b.id,
        title: b.title || existing.title,
        description: b.description || existing.description,
        seriesId: seriesId || existing.seriesId,
        recurringEventId: seriesId || existing.recurringEventId,
        location: locationName || existing.location,
        meetingUrl: b.meetingUrl || b.googleMeetUrl || existing.meetingUrl,
        status: b.status || existing.status,
        roomDetails: roomDetails || existing.roomDetails,
        organizer: organizer || existing.organizer,
        attendees:
          enrichedAttendees.length > 0 ? enrichedAttendees : existing.attendees,
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
      if (b.status === "cancelled") continue;

      const seriesMatch = b.description?.match(
        /<!--series:([a-zA-Z0-9_-]+)-->/,
      );
      const seriesId = seriesMatch ? seriesMatch[1] : undefined;

      unifiedEvents.push({
        id: b.id,
        title: b.title,
        description: b.description || undefined,
        seriesId,
        recurringEventId: seriesId,
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
}
