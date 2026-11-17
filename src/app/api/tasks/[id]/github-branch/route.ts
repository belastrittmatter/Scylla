import { z } from "zod";
import { TaskService } from "@/services/task/task-service";
import { GithubIntegrationService } from "@/services/github/github-integration-service";
import {
  GithubBranchError,
  type GithubBranchErrorCode,
} from "@/services/github/github-branch-service";
import { resolveUserId } from "@/services/api-utils";

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

const BodySchema = z.object({ branchName: z.string().min(1).optional() });

const STATUS_BY_CODE: Record<GithubBranchErrorCode, number> = {
  task_not_found: 404,
  not_linked: 400,
  no_token: 400,
  invalid_branch_name: 400,
  github_error: 502,
};

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

    const task = await TaskService.getTaskById(id);
    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }
    const access = await TaskService.getWriteAccess(task, userId);
    if (access === "not_member") {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }
    if (access === "forbidden") {
      return Response.json(
        { error: "Permission denied: viewers cannot create branches" },
        { status: 403 },
      );
    }

    const body = BodySchema.safeParse(await req.json().catch(() => null));
    const result = await GithubIntegrationService.createBranchForTask(
      id,
      body.success ? body.data.branchName : undefined,
      userId,
    );
    return Response.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof GithubBranchError) {
      return Response.json(
        { error: err.message },
        { status: STATUS_BY_CODE[err.code] },
      );
    }
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Failed to create branch",
      },
      { status: 500 },
    );
  }
}
