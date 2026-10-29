import { GoogleCalendarService } from "@/services/google-calendar";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { account, booking, meetingRoom, user } from "@/db/schema";
import { eq, inArray, and, gte, lte } from "drizzle-orm";

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
  "#e11d48", // rose-600
  "#8b5cf6", // violet-500
  "#d97706", // amber-600
  "#059669", // emerald-600
  "#0891b2", // cyan-600
  "#7c3aed", // violet-600
  "#db2777", // pink-600
  "#4f46e5", // indigo-600
];

async function handleBusyQuery(params: {
  emails?: string[];
  roomIds?: string[];
  userIds?: string[];
  timeMin?: string;
  timeMax?: string;
  sessionHeaders?: Headers;
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

  // 1. Resolve session and Google OAuth Account
  let sessionUserId: string | undefined;
  if (params.sessionHeaders) {
    try {
      const session = await auth.api.getSession({
        headers: params.sessionHeaders,
      });
      if (session?.user) {
        sessionUserId = session.user.id;
      }
    } catch {
      // Ignore session failure
    }
  }

  let googleAccount = null;
  if (sessionUserId) {
    const accounts = await db
      .select()
      .from(account)
      .where(eq(account.userId, sessionUserId));
    googleAccount = accounts.find((a) => a.providerId === "google") || null;
  }
  if (!googleAccount) {
    const anyGoogle = await db
      .select()
      .from(account)
      .where(eq(account.providerId, "google"))
      .limit(1);
    if (anyGoogle.length > 0) {
      googleAccount = anyGoogle[0];
    }
  }

  // 2. Resolve target emails
  const targetEmails = new Set<string>();
  const emailMetadata = new Map<
    string,
    { name: string; type: "user" | "room"; roomId?: string; userId?: string }
  >();

  if (params.emails && params.emails.length > 0) {
    for (const e of params.emails) {
      const trimmed = e.trim().toLowerCase();
      if (trimmed) targetEmails.add(trimmed);
    }
  }

  // Resolve userIds -> emails and roomIds -> emails in parallel
  const [foundUsers, foundRooms] = await Promise.all([
    params.userIds && params.userIds.length > 0
      ? db
          .select()
          .from(user)
          .where(inArray(user.id, params.userIds))
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

  // Fill in missing metadata by looking up remaining emails in user & meetingRoom tables in parallel
  const unresolvedEmails = Array.from(targetEmails).filter(
    (e) => !emailMetadata.has(e),
  );
  if (unresolvedEmails.length > 0) {
    try {
      const [dbUsers, dbRooms] = await Promise.all([
        db
          .select({ email: user.email, name: user.name, id: user.id })
          .from(user)
          .where(inArray(user.email, unresolvedEmails)),
        db
          .select({
            name: meetingRoom.name,
            email: meetingRoom.email,
            googleResourceEmail: meetingRoom.googleResourceEmail,
            id: meetingRoom.id,
          })
          .from(meetingRoom),
      ]);
      for (const u of dbUsers) {
        emailMetadata.set(u.email.toLowerCase(), {
          name: u.name,
          type: "user",
          userId: u.id,
        });
      }
      for (const r of dbRooms) {
        if (r.email) {
          emailMetadata.set(r.email.toLowerCase(), {
            name: r.name,
            type: "room",
            roomId: r.id,
          });
        }
        if (r.googleResourceEmail) {
          emailMetadata.set(r.googleResourceEmail.toLowerCase(), {
            name: r.name,
            type: "room",
            roomId: r.id,
          });
        }
      }
    } catch {
      // Ignore
    }

    // Resolve any still-unresolved emails via Google Workspace
    await Promise.all(
      unresolvedEmails.map(async (em) => {
        if (!emailMetadata.has(em)) {
          const info = await GoogleCalendarService.resolveAttendeeInfo(em, {
            accountRecord: googleAccount || undefined,
            accessToken: googleAccount?.accessToken || undefined,
          });
          emailMetadata.set(em, {
            name: info.name,
            type: info.isResource ? "room" : "user",
          });
        }
      }),
    );
  }

  const allEmailList = Array.from(targetEmails);

  // Map to hold results per email
  const calendars: Record<string, CalendarBusyInfo> = {};
  for (const em of allEmailList) {
    const meta = emailMetadata.get(em);
    const isRoom =
      meta?.type === "room" ||
      em.includes("@resource.calendar.google.com") ||
      em.includes("room");
    const defaultName = meta?.name || em.split("@")[0];

    calendars[em] = {
      name: defaultName,
      email: em,
      type: isRoom ? "room" : "user",
      busy: [],
    };
  }

  // 3 & 4. Query Google Free/Busy API and DB confirmed bookings in parallel
  const [freeBusyMap, overlappingBookings] = await Promise.all([
    allEmailList.length > 0 && googleAccount
      ? GoogleCalendarService.getFreeBusy(allEmailList, startDate, endDate, {
          accountRecord: googleAccount,
          accessToken: googleAccount.accessToken || undefined,
        }).catch((gErr) => {
          console.warn(
            "Google freeBusy call error in /api/calendar/busy:",
            gErr,
          );
          return null;
        })
      : Promise.resolve(null),
    db
      .select()
      .from(booking)
      .where(
        and(
          eq(booking.status, "confirmed"),
          lte(booking.startTime, endDate),
          gte(booking.endTime, startDate),
        ),
      )
      .catch((dbErr) => {
        console.warn("DB booking lookup error in /api/calendar/busy:", dbErr);
        return null;
      }),
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

      // Check room match
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

  // 5. Generate unified event list with distinct colors for rendering
  const events: BusyEventItem[] = [];
  let colorIdx = 0;

  for (const [em, cal] of Object.entries(calendars)) {
    const color = PALETTE[colorIdx % PALETTE.length];
    colorIdx++;

    for (const inv of cal.busy) {
      const isRoom = cal.type === "room";
      events.push({
        id: `busy-${em}-${inv.start}`,
        title: isRoom ? `${cal.name} (Occupied)` : `Busy: ${cal.name}`,
        description: isRoom
          ? `Reserved meeting room: ${cal.name} (${em})`
          : `Busy schedule for ${cal.name} (${em})`,
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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const emailsParam = url.searchParams.get("emails");
    const roomIdsParam = url.searchParams.get("roomIds");
    const userIdsParam = url.searchParams.get("userIds");
    const timeMin = url.searchParams.get("timeMin") || undefined;
    const timeMax = url.searchParams.get("timeMax") || undefined;

    const emails = emailsParam
      ? emailsParam
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
      : [];
    const roomIds = roomIdsParam
      ? roomIdsParam
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean)
      : [];
    const userIds = userIdsParam
      ? userIdsParam
          .split(",")
          .map((u) => u.trim())
          .filter(Boolean)
      : [];

    const result = await handleBusyQuery({
      emails,
      roomIds,
      userIds,
      timeMin,
      timeMax,
      sessionHeaders: req.headers,
    });

    return Response.json(result, { status: 200 });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to fetch busy schedules",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { emails, roomIds, userIds, timeMin, timeMax } = body;

    const result = await handleBusyQuery({
      emails: Array.isArray(emails)
        ? emails
        : typeof emails === "string"
          ? emails.split(",")
          : [],
      roomIds: Array.isArray(roomIds)
        ? roomIds
        : typeof roomIds === "string"
          ? roomIds.split(",")
          : [],
      userIds: Array.isArray(userIds)
        ? userIds
        : typeof userIds === "string"
          ? userIds.split(",")
          : [],
      timeMin,
      timeMax,
      sessionHeaders: req.headers,
    });

    return Response.json(result, { status: 200 });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to fetch busy schedules",
      },
      { status: 500 },
    );
  }
}
