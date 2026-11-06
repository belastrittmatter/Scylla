import { TeamService } from "@/services/team/team-service";
import { UpdateTeamSchema } from "@/services/api-schemas";
import { resolveUserId } from "@/services/api-utils";

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json({ error: "Team ID is required" }, { status: 400 });
    }

    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let team = await TeamService.getTeamById(id);
    if (!team) {
      team = await TeamService.getTeamBySlug(id);
    }
    if (!team) {
      return Response.json(
        { error: `Team not found for id/slug: ${id}` },
        { status: 404 },
      );
    }

    const isMember = await TeamService.isTeamMember(team.id, callerId);
    if (!isMember) {
      return Response.json(
        { error: "Forbidden: Not a member of this team" },
        { status: 403 },
      );
    }

    return Response.json(team, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to get team" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json({ error: "Team ID is required" }, { status: 400 });
    }

    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = await TeamService.isTeamAdminOrOwner(id, callerId);
    if (!isAuthorized) {
      return Response.json(
        {
          error:
            "Forbidden: Only team owners and admins can update team details",
        },
        { status: 403 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const parseResult = UpdateTeamSchema.safeParse(body);
    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const updated = await TeamService.updateTeam(id, parseResult.data);
    return Response.json(updated, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update team";
    if (message.includes("not found")) {
      return Response.json({ error: message }, { status: 404 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json({ error: "Team ID is required" }, { status: 400 });
    }

    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let targetTeam = await TeamService.getTeamById(id);
    if (!targetTeam) {
      targetTeam = await TeamService.getTeamBySlug(id);
    }
    if (!targetTeam) {
      return Response.json(
        { error: `Team not found for id/slug: ${id}` },
        { status: 404 },
      );
    }

    if (targetTeam.ownerId !== callerId) {
      return Response.json(
        { error: "Forbidden: Only the team owner can delete this team" },
        { status: 403 },
      );
    }

    await TeamService.deleteTeam(targetTeam.id);
    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to delete team" },
      { status: 500 },
    );
  }
}
