import { eq } from "drizzle-orm";
import { db } from "@/db";
import { task } from "@/db/schema";
import { GithubAuthService } from "./github-auth-service";
import {
  issueStateForStatus,
  labelNames,
  mergeTaskLabels,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type GithubLabelInput,
} from "./github-labels";
import { jsonInit, loadTaskContext, repoApiUrl } from "./github-task-context";
import type { GithubIssueResult, TaskGithubChanges } from "./github-types";
import type { TaskPriority, TaskStatus } from "@/services/task/task-types";

const { fetchWithAuth } = GithubAuthService;

export async function createIssueForTask(
  taskId: string,
  userId?: string,
): Promise<GithubIssueResult | null> {
  const ctx = await loadTaskContext(taskId);
  if (!ctx) return null;
  const t = ctx.task;
  if (t.githubIssueNumber != null) {
    return {
      number: t.githubIssueNumber,
      url:
        t.githubIssueUrl ??
        `https://github.com/${ctx.fullName}/issues/${t.githubIssueNumber}`,
    };
  }
  try {
    const base = repoApiUrl(ctx);
    const labels = [
      STATUS_LABELS[t.status as TaskStatus],
      PRIORITY_LABELS[t.priority as TaskPriority],
    ].filter(Boolean);
    const res = await fetchWithAuth(
      `${base}/issues`,
      jsonInit("POST", { title: t.title, body: t.description ?? "", labels }),
      userId,
    );
    if (!res.ok) {
      console.warn(`GitHub issue creation failed: ${res.status}`);
      return null;
    }
    const issue = (await res.json()) as { number: number; html_url: string };
    if (t.status === "done" || t.status === "cancelled") {
      const closed = await fetchWithAuth(
        `${base}/issues/${issue.number}`,
        jsonInit("PATCH", issueStateForStatus(t.status)),
        userId,
      );
      if (!closed.ok)
        console.warn(`GitHub issue close failed: ${closed.status}`);
    }
    await db
      .update(task)
      .set({
        githubRepo: ctx.fullName,
        githubIssueNumber: issue.number,
        githubIssueUrl: issue.html_url,
      })
      .where(eq(task.id, t.id));
    return { number: issue.number, url: issue.html_url };
  } catch (error) {
    console.warn("GitHub issue creation failed", error);
    return null;
  }
}

export async function syncTaskToGitHub(
  taskId: string,
  changes: TaskGithubChanges,
  userId?: string,
): Promise<boolean> {
  const ctx = await loadTaskContext(taskId);
  const issueNumber = ctx?.task.githubIssueNumber;
  const hasChange = Object.values(changes).some((v) => v !== undefined);
  if (!ctx || issueNumber == null || !hasChange) return false;
  try {
    const url = `${repoApiUrl(ctx)}/issues/${issueNumber}`;
    const payload: Record<string, unknown> = {};
    if (changes.title !== undefined) payload.title = changes.title;
    if (changes.description !== undefined) {
      payload.body = changes.description ?? "";
    }
    if (changes.status) {
      const { state, state_reason } = issueStateForStatus(changes.status);
      payload.state = state;
      if (state_reason) payload.state_reason = state_reason;
    }
    if (changes.status || changes.priority) {
      const current = await fetchWithAuth(url, {}, userId);
      if (!current.ok) {
        console.warn(`GitHub issue read failed: ${current.status}`);
        return false;
      }
      const issue = (await current.json()) as {
        labels?: GithubLabelInput | null;
      };
      payload.labels = mergeTaskLabels(
        labelNames(issue.labels),
        changes.status,
        changes.priority,
      );
    }
    const res = await fetchWithAuth(url, jsonInit("PATCH", payload), userId);
    if (!res.ok) console.warn(`GitHub issue update failed: ${res.status}`);
    return res.ok;
  } catch (error) {
    console.warn("GitHub issue update failed", error);
    return false;
  }
}
