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

const SERIES_MARKER_REGEX = /<!--series:[a-zA-Z0-9_-]+-->/gi;
const MAX_SANITIZATION_PASSES = 5;

export function sanitizeBookingDescription(
  desc?: string | null,
): string | undefined {
  if (!desc) return undefined;
  if (!desc.includes("<!--series:")) {
    return desc.trim() || undefined;
  }
  let out = desc;
  for (let i = 0; i < MAX_SANITIZATION_PASSES; i++) {
    if (!out.includes("<!--series:")) break;
    const next = out.replace(SERIES_MARKER_REGEX, "");
    if (next === out) break;
    out = next;
  }
  // Strip any remaining or malformed/nested series comment patterns
  out = out.replace(/<!--\s*series:[\s\S]*?-->/gi, "");
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
