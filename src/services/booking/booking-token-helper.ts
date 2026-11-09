import { db } from "@/db";
import { account } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { GoogleCalendarService } from "../google-calendar";

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
