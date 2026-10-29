import { SchedulerService } from "@/services/scheduler";
import { UserService } from "@/services/user";

interface RouteParams {
  params: Promise<{ slug: string }> | { slug: string };
}

export async function GET(_req: Request, context: RouteParams) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return Response.json({ error: "Slug is required" }, { status: 400 });
    }

    let et = await SchedulerService.getEventTypeBySlug(slug);
    if (!et) {
      // Try by ID in case slug is an ID
      et = await SchedulerService.getEventTypeById(slug);
    }

    if (!et) {
      return Response.json({ error: "Event type not found" }, { status: 404 });
    }

    let hostUser: Awaited<ReturnType<typeof UserService.getUserById>> = null;
    if (et.userId) {
      try {
        hostUser = await UserService.getUserById(et.userId);
      } catch {
        // ignore
      }
    }

    const host = {
      id: hostUser?.id || et.userId || "usr_alex_rivera",
      name: hostUser?.name || "Alex Rivera",
      email: hostUser?.email || "alex.rivera@example.com",
      image: hostUser?.image || null,
    };

    return Response.json({ eventType: et, host }, { status: 200 });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch event type details",
      },
      { status: 500 },
    );
  }
}
