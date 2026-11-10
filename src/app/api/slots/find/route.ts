import { SchedulerService } from "@/services/scheduler";
import { FindSlotsParamsSchema } from "@/actions/schemas";
import { resolveUserId } from "@/services/api-utils";
import { UserService } from "@/services/user";
import { db } from "@/db";
import { account, user } from "@/db/schema";
import { and, eq, inArray, or, sql } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const parseResult = FindSlotsParamsSchema.safeParse(body);
    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    // Every attendee must be a registered teammate; unknown addresses and other tenants are refused.
    const allowedUserIds = new Set(await UserService.getTeammateIds(callerId));
    const requested = parseResult.data.attendees.map((a) => a.trim());
    const matchedUsers = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(
        or(
          inArray(user.id, requested),
          inArray(
            sql`lower(${user.email})`,
            requested.map((a) => a.toLowerCase()),
          ),
        ),
      );
    const allAllowed = requested.every((a) =>
      matchedUsers.some(
        (u) =>
          allowedUserIds.has(u.id) &&
          (u.id === a || u.email.toLowerCase() === a.toLowerCase()),
      ),
    );
    if (!allAllowed) {
      return Response.json(
        {
          error:
            "Forbidden: attendees must be registered members of your teams",
        },
        { status: 403 },
      );
    }

    // Availability is read with the caller's own Google credentials, never the server's.
    const [googleAccount] = await db
      .select()
      .from(account)
      .where(
        and(eq(account.userId, callerId), eq(account.providerId, "google")),
      )
      .limit(1);

    const slots = await SchedulerService.findSlots({
      ...parseResult.data,
      attendees: requested,
      accountRecord: googleAccount,
    });
    return Response.json(slots, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to find slots" },
      { status: 500 },
    );
  }
}
