import { db } from "@/db";
import { account, booking, meetingRoom, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { GoogleCalendarService } from "@/services/google-calendar";
import { SchedulerService } from "@/services/scheduler";
import { eq, or } from "drizzle-orm";
import { processDbCalendarSync } from "./calendar-db-sync";
import { processGoogleCalendarSync } from "./calendar-google-sync";
import type { UnifiedCalendarEvent } from "./calendar-types";

export type { UnifiedCalendarEvent } from "./calendar-types";

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

    const effectiveUserId =
      sessionUserId ||
      (process.env.NODE_ENV === "test" ? requestedUserId : undefined);
    const activeUserId = requestedUserId || sessionUserId;

    const [scheduleInfo, googleAccount, dbData] = await Promise.all([
      SchedulerService.getUserSchedule(activeUserId || sessionUserEmail),
      (async () => {
        let acct = null;
        if (effectiveUserId) {
          const accounts = await db
            .select()
            .from(account)
            .where(eq(account.userId, effectiveUserId));
          acct = accounts.find((a) => a.providerId === "google") || null;
        }
        return acct;
      })(),
      Promise.all([
        db.select().from(meetingRoom),
        db.select().from(user),
        effectiveUserId
          ? db
              .select()
              .from(booking)
              .where(
                or(
                  eq(booking.organizerUserId, effectiveUserId),
                  eq(booking.userId, effectiveUserId),
                ),
              )
          : Promise.resolve([]),
      ]).catch((dbErr) => {
        console.warn("Failed to fetch DB bookings for calendar:", dbErr);
        return null;
      }),
    ]);

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

    const attendeeEmails = (attendeeEmailsParam || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && e !== sessionUserEmail?.toLowerCase());

    const unifiedEvents: UnifiedCalendarEvent[] = [];
    const seenEventIds = new Set<string>();
    const gcalCancelledIds = new Set<string>();

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

    // 1. Process Google Calendar events and attendees
    const { gcalFetchSucceeded } = await processGoogleCalendarSync({
      googleAccount,
      timeMin,
      timeMax,
      attendeeEmails,
      attendeeMetaMap,
      unifiedEvents,
      seenEventIds,
      gcalCancelledIds,
    });

    // 2. Process DB confirmed bookings and reconcile deleted events if live fetch succeeded
    await processDbCalendarSync({
      dbData,
      googleAccount,
      gcalFetchSucceeded,
      timeMin,
      timeMax,
      seenEventIds,
      gcalCancelledIds,
      unifiedEvents,
    });

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
