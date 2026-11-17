import { ProjectService } from "@/services/project/project-service";
import { TeamService } from "@/services/team/team-service";
import { GithubSyncService } from "@/services/github/github-sync-service";
import { resolveUserId } from "@/services/api-utils";

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function POST(
  req: Request,
  context: RouteParams,
): Promise<Response> {
  try {
    const { id } = await context.params;
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

    const role = await TeamService.getUserRole(project.teamId, userId);
    if (!role) {
      return Response.json(
        { error: "Forbidden: Not a member of this team" },
        { status: 403 },
      );
    }
    if (role === "viewer") {
      return Response.json(
        { error: "Forbidden: Viewers cannot sync GitHub issues" },
        { status: 403 },
      );
    }

    if (!project.githubRepo) {
      return Response.json(
        { error: "Project is not linked to any GitHub repository" },
        { status: 400 },
      );
    }

    const result = await GithubSyncService.syncProjectIssues(id, userId);
    return Response.json(result, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to sync GitHub issues";
    if (message.startsWith("GitHub API returned")) {
      return Response.json({ error: message }, { status: 502 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
