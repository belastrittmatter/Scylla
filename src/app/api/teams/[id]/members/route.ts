import { TeamService } from "@/services/team/team-service";
import { AddTeamMemberSchema } from "@/services/api-schemas";
import { resolveUserId } from "@/services/api-utils";

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(req: Request, context: RouteParams) {
  try {
    const { id: teamId } = await context.params;
    if (!teamId) {
      return Response.json({ error: "Team ID is required" }, { status: 400 });
    }

    const callerId = await resolveUserId(req);
    if (!callerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isMember = await TeamService.isTeamMember(teamId, callerId);
    if (!isMember) {
      return Response.json(
        { error: "Forbidden: Not a member of this team" },
        { status: 403 },
      );
    }

    const members = await TeamService.listTeamMembers(teamId);
    return Response.json(members, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to list members" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, context: RouteParams) {
  try {
    const { id: teamId } = await context.params;
    if (!teamId) {
      return Response.json({ error: "Team ID is required" }, { status: 400 });
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
        { error: "Forbidden: Only team owners and admins can manage members" },
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

    const parseResult = AddTeamMemberSchema.safeParse(body);
    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const requestedRole = parseResult.data.role ?? "member";
    if (requestedRole === "owner" && !isCallerOwner) {
      return Response.json(
        { error: "Forbidden: Only team owners can assign the owner role" },
        { status: 403 },
      );
    }

    const member = await TeamService.addTeamMember({
      teamId,
      userId: parseResult.data.userId,
      email: parseResult.data.email,
      role: requestedRole,
    });
    return Response.json(member, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to add member" },
      { status: 500 },
    );
  }
}
