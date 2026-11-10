import { db } from "@/db";
import { account } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { GoogleCalendarService } from "@/services/google-calendar";
import type { BookingAttendee } from "./booking-query-service";

export function normalizeAttendees(
  attendees?: Array<string | BookingAttendee>,
): BookingAttendee[] {
  if (!attendees) return [];
  return attendees.map((a) => {
    if (typeof a === "string") {
      return { email: a.trim().toLowerCase(), status: "needsAction" };
    }
    return {
      email: a.email.trim().toLowerCase(),
      name: a.name,
      status: a.status || "needsAction",
    };
  });
}

// Matches only marker-shaped comments (bounded charset), so user text after a
// malformed "<!--series:" is never swallowed up to some later "-->".
const SERIES_MARKER_REGEX = /<!--\s*series:\s*[a-zA-Z0-9_-]*\s*-->/gi;
// What the series reader (cancelSeries / calendar views) would parse.
const READABLE_SERIES_MARKER = /<!--series:[a-zA-Z0-9_-]+-->/i;
const MAX_SANITIZATION_PASSES = 5;

export function sanitizeBookingDescription(
  desc?: string | null,
): string | undefined {
  if (!desc) return undefined;
  let out = desc;
  // Repeat because removing an inner marker can join an outer one.
  for (let i = 0; i < MAX_SANITIZATION_PASSES; i++) {
    const next = out.replace(SERIES_MARKER_REGEX, "");
    if (next === out) break;
    out = next;
  }
  if (READABLE_SERIES_MARKER.test(out)) {
    throw new Error(
      "Invalid booking description: contains unsanitizable series tag",
    );
  }
  return out.trim() || undefined;
}

export async function getOrganizerToken(
  organizerUserId: string,
): Promise<string | undefined> {
  try {
    const userAccounts = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, organizerUserId),
          eq(account.providerId, "google"),
        ),
      )
      .limit(1);

    if (userAccounts.length > 0) {
      return (
        (await GoogleCalendarService.refreshAccountToken(userAccounts[0])) ||
        userAccounts[0].accessToken ||
        undefined
      );
    }
  } catch (tokenErr) {
    console.warn("Could not retrieve organizer Google token:", tokenErr);
  }
  return undefined;
}
