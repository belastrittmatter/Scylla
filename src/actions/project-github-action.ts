"use server";

import { resolveActionUserId, type ActionResult } from "./auth-helper";

export async function createGithubRepositoryAction(payload: {
  name: string;
  description?: string | null;
  isPrivate?: boolean;
  projectName?: string;
}): Promise<
  ActionResult<
    import("@/services/github/github-sync-service").CreatedRepositoryResult
  >
> {
  try {
    const userId = await resolveActionUserId();
    const { GithubSyncService } =
      await import("@/services/github/github-sync-service");
    const result = await GithubSyncService.createAndSetupRepository(
      payload,
      userId,
    );
    return { success: true, data: result };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to create GitHub repository",
    };
  }
}
