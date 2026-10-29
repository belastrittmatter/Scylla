import { TeamService } from "@/services/team/team-service";
import { CreateTeamSchema } from "@/services/api-schemas";
import { resolveUserId, isUniqueConstraintError } from "@/services/api-utils";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = await resolveUserId(req, url.searchParams.get("userId"));
    if (!userId) {
      return Response.json(
        { error: "userId parameter or active session is required" },
        { status: 400 },
      );
    }
    const teams = await TeamService.listUserTeams(userId);
    return Response.json(teams, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to list teams" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const parseResult = CreateTeamSchema.safeParse(body);
    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const {
      name,
      slug,
      description,
      ownerId: explicitOwnerId,
    } = parseResult.data;
    const ownerId = await resolveUserId(req, explicitOwnerId);
    if (!ownerId) {
      return Response.json(
        { error: "ownerId is required when unauthenticated" },
        { status: 400 },
      );
    }

    const team = await TeamService.createTeam({
      name,
      slug,
      description,
      ownerId,
    });
    return Response.json(team, { status: 201 });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return Response.json(
        { error: "A team with this slug already exists" },
        { status: 409 },
      );
    }
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to create team" },
      { status: 500 },
    );
  }
}
