import { SchedulerService } from "@/services/scheduler";
import { FindSlotsParamsSchema } from "@/actions/schemas";
import { resolveUserId } from "@/services/api-utils";
import { db } from "@/db";
import { teamMember, user } from "@/db/schema";
import { eq, inArray, or } from "drizzle-orm";

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

    // Prevent cross-tenant availability leaks: reject if any attendee is a user outside the caller's teams
    const userMemberships = await db
      .select({ teamId: teamMember.teamId })
      .from(teamMember)
      .where(eq(teamMember.userId, callerId));
    const teamIds = userMemberships.map((m) => m.teamId);

    const allowedUserIds = new Set<string>([callerId]);
    if (teamIds.length > 0) {
      const teammates = await db
        .select({ userId: teamMember.userId })
        .from(teamMember)
        .where(inArray(teamMember.teamId, teamIds));
      for (const t of teammates) allowedUserIds.add(t.userId);
    }

    const trimmedAttendees = parseResult.data.attendees.map((a) => a.trim());
    const requestedAttendees = trimmedAttendees.map((a) => a.toLowerCase());
    const matchedUsers = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(
        or(
          inArray(user.id, trimmedAttendees),
          inArray(user.email, requestedAttendees),
        ),
      );

    const hasCrossTenantUser = matchedUsers.some(
      (u) => !allowedUserIds.has(u.id),
    );
    if (hasCrossTenantUser) {
      return Response.json(
        {
          error:
            "Forbidden: You may not query availability for users outside your team",
        },
        { status: 403 },
      );
    }

    const slots = await SchedulerService.findSlots(parseResult.data);
    return Response.json(slots, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to find slots" },
      { status: 500 },
    );
  }
}
