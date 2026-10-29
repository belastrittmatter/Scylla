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

    return Response.json(details, { status: 200 });
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
