import { SchedulerService } from "@/services/scheduler";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const items = await SchedulerService.getEventTypes(userId);
    return Response.json(items, { status: 200 });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to fetch event types",
      },
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

    let userId = body.userId;
    if (!userId) {
      try {
        const session = await auth.api.getSession({ headers: req.headers });
        userId = session?.user?.id;
      } catch {
        // ignore
      }
    }

    const eventName = body.name || body.title || "Meeting";
    const eventTitle = body.title || body.name || "Meeting";

    const created = await SchedulerService.createEventType({
      userId: userId || undefined,
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
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to create event type",
      },
      { status: 500 },
    );
  }
}
