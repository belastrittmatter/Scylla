import {
  MeetingInviteService,
  MeetingInviteError,
} from "@/services/meeting-invite";
import { bookInviteBodySchema } from "@/lib/validations/meeting-invite";

interface RouteParams {
  params: Promise<{ slug: string }> | { slug: string };
}

export async function POST(req: Request, context: RouteParams) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return Response.json(
        { error: "Slug parameter is required" },
        { status: 400 },
      );
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    // Unknown keys (e.g. organizerUserId) are stripped by the schema.
    const parsed = bookInviteBodySchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json(
        {
          error:
            "guestName, a valid guestEmail, and ISO 8601 startTime and endTime are required",
        },
        { status: 400 },
      );
    }

    const result = await MeetingInviteService.bookSlot({
      slug,
      ...parsed.data,
    });

    return Response.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof MeetingInviteError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error("Meeting invite booking failed:", err);
    return Response.json({ error: "Failed to book meeting" }, { status: 500 });
  }
}
