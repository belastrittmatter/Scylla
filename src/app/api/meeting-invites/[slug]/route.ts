import { MeetingInviteService } from "@/services/meeting-invite";

interface RouteParams {
  params: Promise<{ slug: string }> | { slug: string };
}

export async function GET(_req: Request, context: RouteParams) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return Response.json(
        { error: "Slug parameter is required" },
        { status: 400 },
      );
    }

    const details = await MeetingInviteService.getInviteBySlug(slug);
    if (!details) {
      return Response.json(
        { error: "Meeting invite not found" },
        { status: 404 },
      );
    }

    // Public sanitized projection: do not leak participant whitelist or private email addresses
    const publicProjection = {
      invite: {
        id: details.invite.id,
        slug: details.invite.slug,
        title: details.invite.title,
        description: details.invite.description,
        duration: details.invite.duration,
        locationType: details.invite.locationType,
        roomId: details.invite.roomId,
        isActive: details.invite.isActive,
        isRestricted: details.invite.isRestricted,
      },
      organizer: details.organizer
        ? {
            id: details.organizer.id,
            name: details.organizer.name,
            image: details.organizer.image,
          }
        : null,
      room: details.room,
      members: details.members.map((m) => ({
        id: m.id,
        name: m.name,
        image: m.image,
      })),
    };

    return Response.json(publicProjection, { status: 200 });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch meeting invite details",
      },
      { status: 500 },
    );
  }
}
