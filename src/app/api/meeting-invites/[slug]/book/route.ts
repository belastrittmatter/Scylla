import { MeetingInviteService } from "@/services/meeting-invite";

interface RouteParams {
  params: Promise<{ slug: string }> | { slug: string };
}

interface BookSlotBody {
  guestName?: string;
  guestEmail?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export async function POST(req: Request, context: RouteParams) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return Response.json({ error: "Slug parameter is required" }, { status: 400 });
    }

    let body: BookSlotBody;
    try {
      body = (await req.json()) as BookSlotBody;
    } catch {
      return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { guestName, guestEmail, startTime, endTime, notes } = body || {};

    if (!guestName || !guestEmail || !startTime || !endTime) {
      return Response.json(
        { error: "guestName, guestEmail, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    const result = await MeetingInviteService.bookSlot({
      slug,
      guestName,
      guestEmail,
      startTime,
      endTime,
      notes,
    });

    return Response.json(result, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to book meeting" },
      { status: 500 }
    );
  }
}
