import { resolveUserId } from "@/services/api-utils";
import { GithubSyncService } from "@/services/github/github-sync-service";

export async function GET(req: Request) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await GithubSyncService.listUserRepositories(userId);

    return Response.json(
      {
        success: true,
        data: result,
      },
      { status: 200 },
    );
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to fetch GitHub repositories";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      description?: string | null;
      isPrivate?: boolean;
      projectName?: string;
    };

    const repoName = body.name?.trim() || body.projectName?.trim();
    if (!repoName) {
      return Response.json(
        { error: "Repository name is required" },
        { status: 400 },
      );
    }

    const { validateGithubRepoName } = await import("@/lib/github-validation");
    const validation = validateGithubRepoName(repoName);
    if (!validation.valid) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const result = await GithubSyncService.createAndSetupRepository(
      {
        name: validation.cleanName,
        description: body.description,
        isPrivate: typeof body.isPrivate === "boolean" ? body.isPrivate : true,
        projectName: body.projectName,
      },
      userId,
    );

    return Response.json(
      {
        success: true,
        data: result,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/github/repos error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create GitHub repository";
    const status = message.includes("already exists") ? 409 : 500;
    return Response.json({ error: message }, { status });
  }
}
