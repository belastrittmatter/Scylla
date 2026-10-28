import { MeetingInviteService } from "@/services/meeting-invite";

interface RouteParams {
  params: Promise<{ slug: string }> | { slug: string };
}

interface SlotsBody {
  date?: string;
  timeZone?: string;
}

export async function POST(req: Request, context: RouteParams) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return Response.json({ error: "Slug parameter is required" }, { status: 400 });
    }

    let body: SlotsBody;
    try {
      body = (await req.json()) as SlotsBody;
    } catch {
      return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const dateStr = body?.date;
    if (!dateStr || typeof dateStr !== "string") {
      return Response.json(
        { error: "date (YYYY-MM-DD) is required in request body" },
        { status: 400 }
      );
    }

    const timeZone = body?.timeZone || "Asia/Ho_Chi_Minh";
    const availableSlots = await MeetingInviteService.getAvailableSlots(slug, dateStr, timeZone);

    return Response.json({ slots: availableSlots }, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to calculate mutual free slots" },
      { status: 500 }
    );
  }
}
