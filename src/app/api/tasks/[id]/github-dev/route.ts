import { TaskService } from "@/services/task/task-service";
import { TeamService } from "@/services/team/team-service";
import { GithubIntegrationService } from "@/services/github/github-integration-service";
import { resolveUserId } from "@/services/api-utils";

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(
  req: Request,
  context: RouteParams,
): Promise<Response> {
  try {
    const { id } = await context.params;
    const userId = await resolveUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await TaskService.getTaskById(id);
    if (!task || !(await TeamService.isTeamMember(task.teamId, userId))) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    const info = await GithubIntegrationService.getTaskDevelopmentInfo(
      id,
      userId,
    );
    return Response.json(info, { status: 200 });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to load development info",
      },
      { status: 500 },
    );
  }
}
