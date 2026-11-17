import { eq } from "drizzle-orm";
import { db } from "@/db";
import { task } from "@/db/schema";
import { GITHUB_API_URL, GithubAuthService } from "./github-auth-service";
import {
  buildCheckoutCommand,
  generateBranchName,
  isValidBranchName,
} from "./github-dev-utils";
import { getTaskGithubContext } from "./github-task-context";

export type GithubBranchErrorCode =
  | "task_not_found"
  | "not_linked"
  | "no_token"
  | "invalid_branch_name"
  | "github_error";

export class GithubBranchError extends Error {
  readonly code: GithubBranchErrorCode;

  constructor(code: GithubBranchErrorCode, message: string) {
    super(message);
    this.name = "GithubBranchError";
    this.code = code;
  }
}

export interface CreateBranchResult {
  branchName: string;
  alreadyExisted: boolean;
  checkoutCommand: string;
  issueNumber: number | null;
}

async function githubGet<T>(
  url: string,
  userId: string,
  what: string,
): Promise<T> {
  let res: Response;
  try {
    res = await GithubAuthService.fetchWithAuth(url, {}, userId);
  } catch (err) {
    throw new GithubBranchError(
      "github_error",
      `Failed to read ${what} from GitHub: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!res.ok) {
    throw new GithubBranchError(
      "github_error",
      `Failed to read ${what} from GitHub (${res.status})`,
    );
  }
  return (await res.json().catch(() => ({}))) as T;
}

export class GithubBranchService {
  /** Creates a branch for the task on its project's repository, from the default branch head. */
  static async createBranchForTask(
    taskId: string,
    customBranchName?: string,
    userId?: string,
  ): Promise<CreateBranchResult> {
    const [found] = await db
      .select({ id: task.id })
      .from(task)
      .where(eq(task.id, taskId))
      .limit(1);
    if (!found) {
      throw new GithubBranchError(
        "task_not_found",
        `Task "${taskId}" not found`,
      );
    }

    const ctx = await getTaskGithubContext(taskId);
    if (!ctx) {
      throw new GithubBranchError(
        "not_linked",
        "Task's project is not linked to a GitHub repository",
      );
    }
    const { task: t, owner, repo } = ctx;

    const actingUserId = userId ?? t.creatorId;
    const token = await GithubAuthService.resolveToken(actingUserId);
    if (!token) {
      throw new GithubBranchError(
        "no_token",
        "No GitHub access token found. Connect your GitHub account in Account Settings.",
      );
    }

    const branchName =
      customBranchName?.trim() ||
      t.githubBranch ||
      generateBranchName(t.githubIssueNumber, t.title);
    if (!isValidBranchName(branchName)) {
      throw new GithubBranchError(
        "invalid_branch_name",
        `Invalid branch name "${branchName}"`,
      );
    }

    const base = `${GITHUB_API_URL}/repos/${owner}/${repo}`;
    const repoInfo = await githubGet<{ default_branch?: string }>(
      base,
      actingUserId,
      "the repository",
    );
    const defaultBranch = repoInfo.default_branch || "main";
    const ref = await githubGet<{ object?: { sha?: string } }>(
      `${base}/git/ref/heads/${defaultBranch}`,
      actingUserId,
      `branch "${defaultBranch}"`,
    );
    const sha = ref.object?.sha;
    if (!sha) {
      throw new GithubBranchError(
        "github_error",
        `GitHub returned no commit for branch "${defaultBranch}"`,
      );
    }

    let res: Response;
    try {
      res = await GithubAuthService.fetchWithAuth(
        `${base}/git/refs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha }),
        },
        actingUserId,
      );
    } catch (err) {
      throw new GithubBranchError(
        "github_error",
        `Failed to create branch on GitHub: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    if (res.status !== 201 && res.status !== 422) {
      throw new GithubBranchError(
        "github_error",
        `Failed to create branch on GitHub (${res.status})`,
      );
    }

    await db
      .update(task)
      .set({ githubBranch: branchName })
      .where(eq(task.id, taskId));

    return {
      branchName,
      alreadyExisted: res.status === 422,
      checkoutCommand: buildCheckoutCommand(branchName, true),
      issueNumber: t.githubIssueNumber ?? null,
    };
  }
}
