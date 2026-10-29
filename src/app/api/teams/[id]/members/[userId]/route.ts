import { TeamService } from "@/services/team/team-service";

interface RouteParams {
  params:
    Promise<{ id: string; userId: string }> | { id: string; userId: string };
}

export async function DELETE(_req: Request, context: RouteParams) {
  try {
    const { id: teamId, userId } = await context.params;
    if (!teamId || !userId) {
      return Response.json(
        { error: "teamId and userId are required" },
        { status: 400 },
      );
    }

    await TeamService.removeTeamMember(teamId, userId);
    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to remove member" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, context: RouteParams) {
  try {
    const { id: teamId, userId } = await context.params;
    if (!teamId || !userId) {
      return Response.json(
        { error: "teamId and userId are required" },
        { status: 400 },
      );
    }

    const body = await req.json();
    if (!body?.role) {
      return Response.json({ error: "role is required" }, { status: 400 });
    }

    const updated = await TeamService.updateMemberRole(
      teamId,
      userId,
      body.role,
    );
    return Response.json(updated, { status: 200 });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to update member role",
      },
      { status: 500 },
    );
  }
}
