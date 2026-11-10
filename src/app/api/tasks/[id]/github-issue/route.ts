import { resolveUserId } from "@/services/api-utils";
import { GithubIntegrationService } from "@/services/github/github-integration-service";

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function POST(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json({ error: "Task ID is required" }, { status: 400 });
    }

    const userId = await resolveUserId(req);
    const result = await GithubIntegrationService.createIssueForTask(
      id,
      userId,
    );

    if (!result) {
      return Response.json(
        {
          error:
            "Could not create issue. Check GitHub connection and repository link.",
        },
        { status: 400 },
      );
    }

    return Response.json({ success: true, data: result }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create GitHub issue";
    return Response.json({ error: message }, { status: 500 });
  }
}
