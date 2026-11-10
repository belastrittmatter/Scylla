import { TeamService, TeamPermissionError } from "@/services/team/team-service";
import { UpdateMemberRoleSchema } from "@/services/team/team-types";
import { resolveUserId } from "@/services/api-utils";

interface RouteParams {
  params:
    Promise<{ id: string; userId: string }> | { id: string; userId: string };
}

function errorResponse(err: unknown, fallback: string): Response {
  if (err instanceof TeamPermissionError) {
    return Response.json({ error: err.message }, { status: 403 });
  }
  const message = err instanceof Error ? err.message : fallback;
  if (message.includes("not found")) {
    return Response.json({ error: message }, { status: 404 });
  }
  return Response.json({ error: message }, { status: 500 });
}

export async function DELETE(req: Request, context: RouteParams) {
  try {
    const { id: teamId, userId: targetUserId } = await context.params;
    if (!teamId || !targetUserId) {
      return Response.json(
        { error: "teamId and userId are required" },
        { status: 400 },
      );
    }

    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const removed = await TeamService.removeTeamMember(
      teamId,
      targetUserId,
      callerId,
    );
    if (!removed) {
      return Response.json({ error: "Team member not found" }, { status: 404 });
    }
    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    return errorResponse(err, "Failed to remove member");
  }
}

export async function PATCH(req: Request, context: RouteParams) {
  try {
    const { id: teamId, userId: targetUserId } = await context.params;
    if (!teamId || !targetUserId) {
      return Response.json(
        { error: "teamId and userId are required" },
        { status: 400 },
      );
    }

    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
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

    const parsed = UpdateMemberRoleSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const updated = await TeamService.updateMemberRole(
      teamId,
      targetUserId,
      parsed.data.role,
      callerId,
    );
    return Response.json(updated, { status: 200 });
  } catch (err) {
    return errorResponse(err, "Failed to update member role");
  }
}
