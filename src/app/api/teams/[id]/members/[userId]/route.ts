import { TeamService } from "@/services/team/team-service";
import type { TeamRole } from "@/services/team/team-types";
import { resolveUserId } from "@/services/api-utils";

interface RouteParams {
  params:
    Promise<{ id: string; userId: string }> | { id: string; userId: string };
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

    const targetTeam = await TeamService.getTeamById(teamId);
    if (!targetTeam) {
      return Response.json({ error: "Team not found" }, { status: 404 });
    }

    if (targetTeam.ownerId === targetUserId) {
      return Response.json(
        { error: "Cannot remove the owner of the team" },
        { status: 400 },
      );
    }

    const isSelf = callerId === targetUserId;
    const isCallerOwner = targetTeam.ownerId === callerId;
    const callerMembership = targetTeam.members?.find(
      (m) => m.userId === callerId,
    );
    const isCallerAdmin = callerMembership?.role === "admin";

    if (!isSelf && !isCallerOwner && !isCallerAdmin) {
      return Response.json(
        { error: "Forbidden: Only team owners and admins can remove members" },
        { status: 403 },
      );
    }

    const targetMembership = targetTeam.members?.find(
      (m) => m.userId === targetUserId,
    );
    const isTargetAdmin = targetMembership?.role === "admin";
    const isTargetOwnerRole = targetMembership?.role === "owner";

    if ((isTargetAdmin || isTargetOwnerRole) && !isCallerOwner && !isSelf) {
      return Response.json(
        { error: "Forbidden: Admins cannot remove owners or other admins" },
        { status: 403 },
      );
    }

    await TeamService.removeTeamMember(teamId, targetUserId);
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

    const targetTeam = await TeamService.getTeamById(teamId);
    if (!targetTeam) {
      return Response.json({ error: "Team not found" }, { status: 404 });
    }

    const isCallerOwner = targetTeam.ownerId === callerId;
    const callerMembership = targetTeam.members?.find(
      (m) => m.userId === callerId,
    );
    const isCallerAdmin = callerMembership?.role === "admin";

    if (!isCallerOwner && !isCallerAdmin) {
      return Response.json(
        {
          error:
            "Forbidden: Only team owners and admins can update member roles",
        },
        { status: 403 },
      );
    }

    let body: { role?: unknown };
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    if (!body?.role || typeof body.role !== "string") {
      return Response.json({ error: "role is required" }, { status: 400 });
    }

    // Role escalation checks:
    if (body.role === "owner" && !isCallerOwner) {
      return Response.json(
        { error: "Forbidden: Only team owners can assign the owner role" },
        { status: 403 },
      );
    }

    const targetMembership = targetTeam.members?.find(
      (m) => m.userId === targetUserId,
    );
    const isTargetOwner =
      targetTeam.ownerId === targetUserId || targetMembership?.role === "owner";
    const isTargetAdmin = targetMembership?.role === "admin";

    if (isTargetOwner && !isCallerOwner) {
      return Response.json(
        { error: "Forbidden: Admins cannot modify the team owner" },
        { status: 403 },
      );
    }

    if (isTargetAdmin && !isCallerOwner && callerId !== targetUserId) {
      return Response.json(
        { error: "Forbidden: Admins cannot change the role of other admins" },
        { status: 403 },
      );
    }

    const updated = await TeamService.updateMemberRole(
      teamId,
      targetUserId,
      body.role as TeamRole,
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
