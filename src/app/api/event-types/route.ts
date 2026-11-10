import { SchedulerService } from "@/services/scheduler";
import { resolveUserId } from "@/services/api-utils";
import { db } from "@/db";
import { eventType, teamMember } from "@/db/schema";
import { eq, and, inArray, or, isNull, asc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    let targetUserId = callerId;
    if (requestedUserId && requestedUserId !== callerId) {
      const callerTeams = await db
        .select({ teamId: teamMember.teamId })
        .from(teamMember)
        .where(eq(teamMember.userId, callerId));
      const teamIds = callerTeams.map((t) => t.teamId);
      if (teamIds.length === 0) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
      const shared = await db
        .select({ id: teamMember.id })
        .from(teamMember)
        .where(
          and(
            eq(teamMember.userId, requestedUserId),
            inArray(teamMember.teamId, teamIds),
          ),
        )
        .limit(1);
      if (shared.length === 0) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
      targetUserId = requestedUserId;
    }

    // Return target user's custom event types along with default system templates (null userId)
    const items = await db
      .select()
      .from(eventType)
      .where(or(eq(eventType.userId, targetUserId), isNull(eventType.userId)))
      .orderBy(asc(eventType.duration), asc(eventType.name));

    return Response.json(items, { status: 200 });
  } catch (err) {
    console.error("GET /api/event-types failed:", err);
    return Response.json(
      { error: "Failed to fetch event types" },
      { status: 500 },
    );
  }
}

interface CreateEventTypeBody {
  name?: string;
  title?: string;
  slug?: string;
  description?: string;
  duration?: number | string;
  requiresRoom?: boolean;
  beforeBuffer?: number | string;
  afterBuffer?: number | string;
  userId?: string;
}

export async function POST(req: Request) {
  try {
    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: CreateEventTypeBody;
    try {
      body = (await req.json()) as CreateEventTypeBody;
    } catch {
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    if (!body?.name && !body?.title) {
      return Response.json(
        { error: "Event type name or title is required" },
        { status: 400 },
      );
    }

    // Bind event type strictly to authenticated caller ID
    const userId = callerId;

    const eventName = body.name || body.title || "Meeting";
    const eventTitle = body.title || body.name || "Meeting";

    const created = await SchedulerService.createEventType({
      userId,
      name: eventName,
      title: eventTitle,
      slug: body.slug,
      description: body.description,
      duration: Number(body.duration) || 30,
      requiresRoom: Boolean(body.requiresRoom),
      beforeBuffer:
        body.beforeBuffer !== undefined ? Number(body.beforeBuffer) : 0,
      afterBuffer:
        body.afterBuffer !== undefined ? Number(body.afterBuffer) : 0,
    });

    return Response.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/event-types failed:", err);
    return Response.json(
      { error: "Failed to create event type" },
      { status: 500 },
    );
  }
}
