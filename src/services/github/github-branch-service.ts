import { eq } from "drizzle-orm";
import { db } from "@/db";
import { task } from "@/db/schema";
import { GithubAuthService } from "./github-auth-service";
import {
  buildCheckoutCommand,
  generateBranchName,
  isValidBranchName,
} from "./github-dev-utils";
import { GithubApiError } from "./github-errors";
import {
  pickLinkedPullRequest,
  timelinePullNumbers,
  toPullSummary,
  type GithubRawPull,
} from "./github-pr-linking";
import {
  contextForTask,
  jsonInit,
  loadTask,
  loadTaskContext,
  repoApiUrl,
} from "./github-task-context";
import type {
  CreateBranchResult,
  GithubPrState,
  GithubPullSummary,
  TaskDevelopmentInfo,
} from "./github-types";

const { fetchWithAuth } = GithubAuthService;

async function getJson<T>(url: string, userId?: string): Promise<T> {
  const res = await fetchWithAuth(url, {}, userId);
  if (!res.ok) throw new GithubApiError(res.status, `GitHub ${res.status}`);
  return (await res.json()) as T;
}

export async function createBranchForTask(
  taskId: string,
  userId?: string,
  branchName?: string,
): Promise<CreateBranchResult> {
  const row = await loadTask(taskId);
  if (!row) throw new Error("Task not found");
  const ctx = await contextForTask(row);
  if (!ctx) throw new Error("Task is not linked to a GitHub repository");
  const branch =
    branchName?.trim() ||
    row.githubBranch ||
    generateBranchName(row.githubIssueNumber, row.title);
  if (!isValidBranchName(branch)) throw new Error("Invalid branch name");

  const base = repoApiUrl(ctx);
  const repoInfo = await getJson<{ default_branch: string }>(base, userId);
  const ref = await getJson<{ object: { sha: string } }>(
    `${base}/git/ref/heads/${repoInfo.default_branch}`,
    userId,
  );
  const res = await fetchWithAuth(
    `${base}/git/refs`,
    jsonInit("POST", { ref: `refs/heads/${branch}`, sha: ref.object.sha }),
    userId,
  );
  if (!res.ok && res.status !== 422) {
    throw new GithubApiError(res.status, `GitHub ${res.status}`);
  }
  await db
    .update(task)
    .set({ githubBranch: branch })
    .where(eq(task.id, taskId));
  return {
    branch,
    alreadyExisted: res.status === 422,
    checkoutCommand: buildCheckoutCommand(branch),
    url: `https://github.com/${ctx.fullName}/tree/${branch}`,
  };
}

export async function refreshTaskPullRequest(
  taskId: string,
  userId?: string,
): Promise<GithubPullSummary | null> {
  const ctx = await loadTaskContext(taskId);
  if (!ctx) return null;
  const { githubIssueNumber: issueNumber, githubBranch } = ctx.task;
  if (issueNumber == null && !githubBranch) return null;
  try {
    const base = repoApiUrl(ctx);
    const raw = await getJson<GithubRawPull[]>(
      `${base}/pulls?state=all&per_page=100`,
      userId,
    );
    let events: unknown = [];
    if (issueNumber != null) {
      events = await getJson<unknown>(
        `${base}/issues/${issueNumber}/timeline?per_page=100`,
        userId,
      ).catch(() => []);
    }
    const found = pickLinkedPullRequest(raw.map(toPullSummary), {
      issueNumber,
      branch: githubBranch,
      timelinePullNumbers: timelinePullNumbers(events, ctx.fullName),
    });
    if (!found) return null;
    await db
      .update(task)
      .set({
        githubPrNumber: found.number,
        githubPrUrl: found.url,
        githubPrStatus: found.state,
        githubBranch: githubBranch ?? found.headRef,
      })
      .where(eq(task.id, taskId));
    return found;
  } catch (error) {
    console.warn("GitHub pull request lookup failed", error);
    return null;
  }
}

export async function getTaskDevelopmentInfo(
  taskId: string,
  userId?: string,
): Promise<TaskDevelopmentInfo | null> {
  const row = await loadTask(taskId);
  if (!row) return null;
  const ctx = await contextForTask(row);
  const refreshed = ctx ? await refreshTaskPullRequest(taskId, userId) : null;
  const pullRequest =
    refreshed ??
    (row.githubPrNumber != null
      ? {
          number: row.githubPrNumber,
          url: row.githubPrUrl ?? "",
          title: "",
          state: (row.githubPrStatus as GithubPrState | null) ?? "open",
          headRef: row.githubBranch,
        }
      : null);
  return {
    repository: ctx?.fullName ?? null,
    issueNumber: row.githubIssueNumber,
    issueUrl: row.githubIssueUrl,
    branch: row.githubBranch,
    suggestedBranch: generateBranchName(row.githubIssueNumber, row.title),
    checkoutCommand: row.githubBranch
      ? buildCheckoutCommand(row.githubBranch)
      : null,
    pullRequest,
  };
}
