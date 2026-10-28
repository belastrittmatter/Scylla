import { SchedulerService } from "@/services/scheduler";
import { FindSlotsParamsSchema } from "@/actions/schemas";

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const parseResult = FindSlotsParamsSchema.safeParse(body);
    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const slots = await SchedulerService.findSlots(parseResult.data);
    return Response.json(slots, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to find slots" },
      { status: 500 }
    );
  }
}
