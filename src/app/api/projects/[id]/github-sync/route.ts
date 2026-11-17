import { parseGithubRepoFullName } from "@/lib/github-validation";
import { resolveUserId } from "@/services/api-utils";
import { GithubApiError } from "@/services/github/github-errors";
import { GithubSyncService } from "@/services/github/github-sync-service";
import { ProjectService } from "@/services/project/project-service";
import { TeamService } from "@/services/team/team-service";

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function POST(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const userId = await resolveUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await ProjectService.getProjectById(id);
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
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

    if (!parseGithubRepoFullName(project.githubRepo)) {
      return Response.json(
        { error: "Project is not linked to a GitHub repository" },
        { status: 400 },
      );
    }

    const data = await GithubSyncService.syncProjectIssues(id, userId);
    return Response.json({ data }, { status: 200 });
  } catch (err) {
    const status = err instanceof GithubApiError ? 502 : 500;
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to sync GitHub" },
      { status },
    );
  }
}
