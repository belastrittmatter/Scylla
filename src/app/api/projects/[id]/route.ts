import { ProjectService } from "@/services/project/project-service";
import { TeamService } from "@/services/team/team-service";
import { UpdateProjectSchema } from "@/services/api-schemas";
import { resolveUserId } from "@/services/api-utils";

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

    const userId = await resolveUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await ProjectService.getProjectById(id);
    if (!project) {
      return Response.json(
        { error: `Project not found for id: ${id}` },
        { status: 404 },
      );
    }

    const isMember = await TeamService.isTeamMember(project.teamId, userId);
    if (!isMember) {
      return Response.json(
        { error: "Forbidden: Not a member of this team" },
        { status: 403 },
      );
    }

    return Response.json(project, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to get project" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

    const userId = await resolveUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await ProjectService.getProjectById(id);
    if (!project) {
      return Response.json(
        { error: `Project not found for id: ${id}` },
        { status: 404 },
      );
    }

    const isAuthorized = await TeamService.isTeamAdminOrOwner(
      project.teamId,
      userId,
    );
    if (!isAuthorized) {
      return Response.json(
        { error: "Forbidden: Only team owners and admins can update projects" },
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

    const parseResult = UpdateProjectSchema.safeParse(body);
    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const updated = await ProjectService.updateProject(id, parseResult.data);
    return Response.json(updated, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update project";
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
      return Response.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

    const userId = await resolveUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await ProjectService.getProjectById(id);
    if (!project) {
      return Response.json(
        { error: `Project not found for id: ${id}` },
        { status: 404 },
      );
    }

    const isAuthorized = await TeamService.isTeamAdminOrOwner(
      project.teamId,
      userId,
    );
    if (!isAuthorized) {
      return Response.json(
        { error: "Forbidden: Only team owners and admins can delete projects" },
        { status: 403 },
      );
    }

    await ProjectService.deleteProject(id);
    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Failed to delete project",
      },
      { status: 500 },
    );
  }
}
