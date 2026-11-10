import { resolveUserId } from "@/services/api-utils";
import { GithubSyncService } from "@/services/github/github-sync-service";

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function POST(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

    const userId = await resolveUserId(req);
    const result = await GithubSyncService.syncProjectIssues(
      id,
      userId || undefined,
    );

    return Response.json(
      {
        success: true,
        data: result,
      },
      { status: 200 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to sync GitHub issues";
    const status = message.includes("not found")
      ? 404
      : message.includes("Invalid")
        ? 400
        : 500;

    return Response.json({ error: message }, { status });
  }
}
