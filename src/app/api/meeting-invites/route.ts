import { auth } from "@/lib/auth";
import { MeetingInviteService } from "@/services/meeting-invite";

interface CreateMeetingInviteBody {
  title?: string;
  description?: string;
  duration?: number | string;
  organizerUserId?: string;
  memberEmails?: string[];
  allowedEmails?: string[];
  locationType?: "meet" | "room";
  roomId?: string;
  isRestricted?: boolean;
}

export async function POST(req: Request) {
  try {
    let body: CreateMeetingInviteBody;
    try {
      body = (await req.json()) as CreateMeetingInviteBody;
    } catch {
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    if (!body?.title) {
      return Response.json(
        { error: "Meeting title is required" },
        { status: 400 },
      );
    }

    // Resolve current user / organizer
    let organizerUserId = body.organizerUserId;
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      if (session?.user?.id) {
        organizerUserId = session.user.id;
      }
    } catch {
      // ignore
    }

    if (!organizerUserId) {
      return Response.json(
        { error: "Unauthorized: organizer user ID required" },
        { status: 401 },
      );
    }

    const memberEmails: string[] = Array.isArray(body.memberEmails)
      ? body.memberEmails
      : [];
    const allowedEmails: string[] = Array.isArray(body.allowedEmails)
      ? body.allowedEmails
      : [];

    const invite = await MeetingInviteService.createInvite({
      title: body.title,
      description: body.description,
      duration: Number(body.duration) || 30,
      organizerUserId,
      memberEmails,
      locationType: body.locationType || (body.roomId ? "room" : "meet"),
      roomId: body.roomId || undefined,
      isRestricted: Boolean(body.isRestricted),
      allowedEmails,
    });

    const hostHeader = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const bookingUrl = `${protocol}://${hostHeader}/book/${invite.slug}`;

    return Response.json(
      {
        invite,
        bookingUrl,
      },
      { status: 201 },
    );
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to create meeting invite",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    let sessionUserId: string | undefined;
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      sessionUserId = session?.user?.id;
    } catch {
      // ignore
    }

    if (!sessionUserId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invites =
      await MeetingInviteService.listInvitesByOrganizer(sessionUserId);
    return Response.json(invites, { status: 200 });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to list meeting invites",
      },
      { status: 500 },
    );
  }
}
