import { TeamService } from "@/services/team/team-service";
import { AddTeamMemberSchema } from "@/services/api-schemas";

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(_req: Request, context: RouteParams) {
  try {
    const { id: teamId } = await context.params;
    if (!teamId) {
      return Response.json({ error: "Team ID is required" }, { status: 400 });
    }

    const members = await TeamService.listTeamMembers(teamId);
    return Response.json(members, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to list members" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, context: RouteParams) {
  try {
    const { id: teamId } = await context.params;
    if (!teamId) {
      return Response.json({ error: "Team ID is required" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const parseResult = AddTeamMemberSchema.safeParse(body);
    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const member = await TeamService.addTeamMember({
      teamId,
      userId: parseResult.data.userId,
      email: parseResult.data.email,
      role: parseResult.data.role ?? "member",
    });
    return Response.json(member, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to add member" },
      { status: 500 }
    );
  }
}
