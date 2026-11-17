import { resolveUserId } from "@/services/api-utils";
import {
  GithubRepoError,
  GithubRepoService,
} from "@/services/github/github-repo-service";

export async function GET(req: Request): Promise<Response> {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await GithubRepoService.listUserRepositories(userId);
    return Response.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof GithubRepoError && err.code === "github_error") {
      return Response.json({ error: err.message }, { status: 502 });
    }
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to list repositories",
      },
      { status: 500 },
    );
  }
}
