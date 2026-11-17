import { resolveUserId } from "@/services/api-utils";
import { GithubApiError } from "@/services/github/github-errors";
import { GithubRepoService } from "@/services/github/github-repo-service";

export async function GET(req: Request) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await GithubRepoService.listUserRepositories(userId);
    return Response.json(result, { status: 200 });
  } catch (err) {
    const status = err instanceof GithubApiError ? 502 : 500;
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to list repositories",
      },
      { status },
    );
  }
}
