import { GoogleCalendarService } from "@/services/google-calendar";
import { db } from "@/db";
import { account, booking, meetingRoom, user, teamMember } from "@/db/schema";
import { eq, inArray, and, lte, gte, or } from "drizzle-orm";

export interface BusyInterval {
  start: string;
  end: string;
  source?: "google" | "db";
}

export interface CalendarBusyInfo {
  name: string;
  email: string;
  type: "user" | "room";
  busy: BusyInterval[];
}

export interface BusyEventItem {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  color: string;
  attendee: {
    name: string;
    email: string;
    type: "user" | "room";
  };
  source: "google" | "db";
}

const PALETTE = [
  "#e11d48",
  "#8b5cf6",
  "#d97706",
  "#059669",
  "#0891b2",
  "#7c3aed",
  "#db2777",
  "#4f46e5",
];

export async function handleBusyQuery(params: {
  callerId: string;
  emails?: string[];
  roomIds?: string[];
  userIds?: string[];
  timeMin?: string;
  timeMax?: string;
}) {
  const now = new Date();
  const defaultMin = new Date(now.setHours(0, 0, 0, 0)).toISOString();
  const defaultMax = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const timeMin = params.timeMin || defaultMin;
  const timeMax = params.timeMax || defaultMax;
  const startDate = new Date(timeMin);
  const endDate = new Date(timeMax);

  if (
    isNaN(startDate.getTime()) ||
    isNaN(endDate.getTime()) ||
    startDate >= endDate
  ) {
    throw new Error("Invalid time range: timeMin must be before timeMax");
  }

  if (
    isNaN(startDate.getTime()) ||
    isNaN(endDate.getTime()) ||
    startDate >= endDate
  ) {
    throw new Error("Invalid time range: timeMin must be before timeMax");
  }

  // 1. Resolve caller's Google OAuth account
  const accounts = await db
    .select()
    .from(account)
    .where(eq(account.userId, params.callerId));
  const googleAccount = accounts.find((a) => a.providerId === "google") || null;

  // 2. Determine allowed teammate user IDs to prevent cross-tenant lookup
  const userMemberships = await db
    .select({ teamId: teamMember.teamId })
    .from(teamMember)
    .where(eq(teamMember.userId, params.callerId));
  const teamIds = userMemberships.map((m) => m.teamId);

  const allowedUserIds = new Set<string>([params.callerId]);
  if (teamIds.length > 0) {
    const teammates = await db
      .select({ userId: teamMember.userId })
      .from(teamMember)
      .where(inArray(teamMember.teamId, teamIds));
    for (const t of teammates) allowedUserIds.add(t.userId);
  }

  // Filter requested userIds to authorized teammate IDs only
  const requestedUserIds = (params.userIds || []).filter((uid) =>
    allowedUserIds.has(uid),
  );

  // 3. Resolve target emails and room IDs
  const targetEmails = new Set<string>();
  const emailMetadata = new Map<
    string,
    { name: string; type: "user" | "room"; roomId?: string; userId?: string }
  >();

  const [foundUsers, foundRooms] = await Promise.all([
    requestedUserIds.length > 0
      ? db
          .select()
          .from(user)
          .where(inArray(user.id, requestedUserIds))
          .catch(() => [])
      : Promise.resolve([]),
    params.roomIds && params.roomIds.length > 0
      ? db
          .select()
          .from(meetingRoom)
          .where(inArray(meetingRoom.id, params.roomIds))
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  for (const u of foundUsers) {
    const em = u.email.toLowerCase();
    targetEmails.add(em);
    emailMetadata.set(em, { name: u.name, type: "user", userId: u.id });
  }

  for (const r of foundRooms) {
    const em = (r.googleResourceEmail || r.email).toLowerCase();
    targetEmails.add(em);
    emailMetadata.set(em, { name: r.name, type: "room", roomId: r.id });
    if (r.email && r.email.toLowerCase() !== em) {
      targetEmails.add(r.email.toLowerCase());
      emailMetadata.set(r.email.toLowerCase(), {
        name: r.name,
        type: "room",
        roomId: r.id,
      });
    }
  }

  // Add explicit emails only if they match known teammates or rooms
  if (params.emails && params.emails.length > 0) {
    const requestedEmails = new Set(
      params.emails.map((e) => e.trim().toLowerCase()).filter(Boolean),
    );
    const teammates = await db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .where(inArray(user.id, Array.from(allowedUserIds)));
    for (const u of teammates) {
      const em = u.email.toLowerCase();
      if (!requestedEmails.has(em)) continue;
      targetEmails.add(em);
      if (!emailMetadata.has(em)) {
        emailMetadata.set(em, { name: u.name, type: "user", userId: u.id });
      }
    }
    for (const e of params.emails) {
      const trimmed = e.trim().toLowerCase();
      if (
        trimmed &&
        (targetEmails.has(trimmed) ||
          trimmed.includes("resource.calendar.google.com"))
      ) {
        targetEmails.add(trimmed);
      }
    }
  }

  const allEmailList = Array.from(targetEmails);
  const calendars: Record<string, CalendarBusyInfo> = {};
  for (const em of allEmailList) {
    const meta = emailMetadata.get(em);
    calendars[em] = {
      name: meta?.name || em.split("@")[0],
      email: em,
      type:
        meta?.type ||
        (em.includes("resource.calendar.google.com") ? "room" : "user"),
      busy: [],
    };
  }

  const allowedUserArray = Array.from(allowedUserIds);
  const foundRoomIds = foundRooms.map((r) => r.id);

  // 4. Concurrently query Google FreeBusy (if caller has Google OAuth) and scoped DB bookings
  const [freeBusyMap, overlappingBookings] = await Promise.all([
    allEmailList.length > 0 && googleAccount
      ? GoogleCalendarService.getFreeBusy(allEmailList, startDate, endDate, {
          accountRecord: googleAccount,
          accessToken: googleAccount.accessToken || undefined,
        }).catch(() => null)
      : Promise.resolve(null),
    db
      .select()
      .from(booking)
      .where(
        and(
          eq(booking.status, "confirmed"),
          lte(booking.startTime, endDate),
          gte(booking.endTime, startDate),
          or(
            inArray(booking.userId, allowedUserArray),
            inArray(booking.organizerUserId, allowedUserArray),
            foundRoomIds.length > 0
              ? inArray(booking.roomId, foundRoomIds)
              : undefined,
          ),
        ),
      )
      .catch(() => null),
  ]);

  if (freeBusyMap) {
    for (const [em, intervals] of Object.entries(freeBusyMap)) {
      if (!Array.isArray(intervals)) continue;
      const lowerEm = em.toLowerCase();
      if (!calendars[lowerEm]) {
        calendars[lowerEm] = {
          name: emailMetadata.get(lowerEm)?.name || lowerEm.split("@")[0],
          email: lowerEm,
          type: lowerEm.includes("resource.calendar.google.com")
            ? "room"
            : "user",
          busy: [],
        };
      }
      for (const inv of intervals) {
        const invStartMs = new Date(inv.start).getTime();
        const invEndMs = new Date(inv.end).getTime();
        if (isNaN(invStartMs) || isNaN(invEndMs) || invStartMs >= invEndMs)
          continue;
        if (invEndMs - invStartMs >= 24 * 60 * 60 * 1000) continue;

        calendars[lowerEm].busy.push({
          start: inv.start,
          end: inv.end,
          source: "google",
        });
      }
    }
  }

  if (overlappingBookings) {
    for (const b of overlappingBookings) {
      const bStart = new Date(b.startTime).toISOString();
      const bEnd = new Date(b.endTime).toISOString();
      const bStartMs = new Date(bStart).getTime();
      const bEndMs = new Date(bEnd).getTime();

      for (const [em, cal] of Object.entries(calendars)) {
        const meta = emailMetadata.get(em);
        const matchesRoom = Boolean(meta?.roomId && meta.roomId === b.roomId);
        const matchesUser =
          (meta?.userId && meta.userId === b.userId) ||
          (meta?.userId && meta.userId === b.organizerUserId);

        const attendeesRaw = Array.isArray(b.attendees)
          ? (b.attendees as Array<{ email?: string }>)
          : [];
        const isAttendee = attendeesRaw.some(
          (a) => a.email && a.email.toLowerCase() === em,
        );

        if (matchesRoom || matchesUser || isAttendee) {
          const alreadyExists = cal.busy.some(
            (inv) =>
              Math.abs(new Date(inv.start).getTime() - bStartMs) < 60000 &&
              Math.abs(new Date(inv.end).getTime() - bEndMs) < 60000,
          );
          if (!alreadyExists) {
            cal.busy.push({
              start: bStart,
              end: bEnd,
              source: "db",
            });
          }
        }
      }
    }
  }

  // 5. Generate unified event list with distinct colors
  const events: BusyEventItem[] = [];
  let colorIdx = 0;

  for (const [em, cal] of Object.entries(calendars)) {
    const color = PALETTE[colorIdx % PALETTE.length];
    colorIdx++;

    for (const inv of cal.busy) {
      events.push({
        id: `busy-${em}-${inv.start}-${inv.source || "item"}`,
        title: `${cal.name} (Busy)`,
        description: `Scheduled busy slot (${inv.source === "google" ? "Google Calendar" : "Booking"})`,
        start: inv.start,
        end: inv.end,
        color,
        attendee: {
          name: cal.name,
          email: em,
          type: cal.type,
        },
        source: inv.source || "google",
      });
    }
  }

  return {
    timeMin,
    timeMax,
    totalCalendars: Object.keys(calendars).length,
    calendars,
    events,
  };
}
