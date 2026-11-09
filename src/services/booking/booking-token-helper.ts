import { db } from "@/db";
import { account } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { GoogleCalendarService } from "../google-calendar";
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

export function sanitizeBookingDescription(
  desc?: string | null,
): string | undefined {
  if (!desc) return undefined;
  let prev = desc;
  let out = desc;
  do {
    prev = out;
    out = out.replace(/<!--series:[\s\S]*?-->/gi, "");
  } while (out !== prev);
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
