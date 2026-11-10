import {
  MeetingInviteService,
  MeetingInviteError,
} from "@/services/meeting-invite";
import { inviteSlotsBodySchema } from "@/lib/validations/meeting-invite";

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

    const parsed = inviteSlotsBodySchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json(
        {
          error:
            "date (YYYY-MM-DD) is required and timeZone must be a valid IANA time zone",
        },
        { status: 400 },
      );
    }

    const availableSlots = await MeetingInviteService.getAvailableSlots(
      slug,
      parsed.data.date,
      parsed.data.timeZone,
    );

    return Response.json({ slots: availableSlots }, { status: 200 });
  } catch (err) {
    if (err instanceof MeetingInviteError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error("Meeting invite slot lookup failed:", err);
    return Response.json(
      { error: "Failed to calculate mutual free slots" },
      { status: 500 },
    );
  }
}
