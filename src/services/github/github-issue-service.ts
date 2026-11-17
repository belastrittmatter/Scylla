import { eq } from "drizzle-orm";
import { db } from "@/db";
import { task } from "@/db/schema";
import { GITHUB_API_URL, GithubAuthService } from "./github-auth-service";
import {
  buildManagedLabels,
  issueStateForStatus,
  mergeIssueLabels,
} from "./github-labels";
import { getTaskGithubContext } from "./github-task-context";
import { GithubUserResolver } from "./github-user-resolver";

export interface CreateIssueResult {
  number: number;
  url: string;
}

export interface SyncTaskToGitHubUpdates {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

function sendJson(
  url: string,
  method: "POST" | "PATCH",
  payload: Record<string, unknown>,
  userId: string,
): Promise<Response> {
  return GithubAuthService.fetchWithAuth(
    url,
    { method, headers: JSON_HEADERS, body: JSON.stringify(payload) },
    userId,
  );
}

/** Resolves the assignee's GitHub login and invites them as a collaborator. */
async function loginForAssignee(
  assigneeId: string,
  owner: string,
  repo: string,
  actingUserId: string,
): Promise<string | null> {
  const login = await GithubUserResolver.resolveGitHubUsername(
    assigneeId,
    actingUserId,
  );
  if (!login) return null;
  await GithubUserResolver.inviteCollaborator(owner, repo, login, actingUserId);
  return login;
}

/** Names of the labels an issue has now; empty when the issue cannot be read. */
async function currentLabelNames(
  issueUrl: string,
  userId: string,
): Promise<string[]> {
  const res = await GithubAuthService.fetchWithAuth(
    issueUrl,
    undefined,
    userId,
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    labels?: Array<string | { name?: string }>;
  };
  return (data.labels ?? []).flatMap((label) => {
    const name = typeof label === "string" ? label : label.name;
    return name ? [name] : [];
  });
}

export class GithubIssueService {
  /** Creates the GitHub issue for a task once; returns null when it cannot. */
  static async createIssueForTask(
    taskId: string,
    userId?: string,
  ): Promise<CreateIssueResult | null> {
    try {
      const ctx = await getTaskGithubContext(taskId);
      if (!ctx) return null;
      const { task: row, owner, repo } = ctx;
      const actingUser = userId ?? row.creatorId;

      if (!(await GithubAuthService.resolveToken(actingUser))) {
        console.warn("No GitHub token available to create an issue");
        return null;
      }
      if (row.githubIssueNumber) {
        return {
          number: row.githubIssueNumber,
          url:
            row.githubIssueUrl ??
            `https://github.com/${owner}/${repo}/issues/${row.githubIssueNumber}`,
        };
      }

      const payload: Record<string, unknown> = {
        title: row.title,
        body: row.description ?? "",
        labels: buildManagedLabels(row),
      };
      if (row.assigneeId) {
        const login = await loginForAssignee(
          row.assigneeId,
          owner,
          repo,
          actingUser,
        );
        if (login) payload.assignees = [login];
      }

      const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/issues`;
      let res = await sendJson(url, "POST", payload, actingUser);
      if (res.status === 422 && payload.assignees) {
        const { assignees: _dropped, ...withoutAssignees } = payload;
        res = await sendJson(url, "POST", withoutAssignees, actingUser);
      }
      if (!res.ok) {
        console.warn(`GitHub issue creation failed with ${res.status}`);
        return null;
      }

      const created = (await res.json()) as {
        number: number;
        html_url: string;
      };
      await db
        .update(task)
        .set({
          githubIssueNumber: created.number,
          githubIssueUrl: created.html_url,
        })
        .where(eq(task.id, taskId));
      return { number: created.number, url: created.html_url };
    } catch (error) {
      console.warn("Failed to create GitHub issue:", error);
      return null;
    }
  }

  /** Pushes the given task fields to the task's GitHub issue. */
  static async syncTaskToGitHub(
    taskId: string,
    updates: SyncTaskToGitHubUpdates,
    userId?: string,
  ): Promise<boolean> {
    try {
      const ctx = await getTaskGithubContext(taskId);
      if (!ctx) return false;
      const { task: row, owner, repo } = ctx;
      const actingUser = userId ?? row.creatorId;
      if (!(await GithubAuthService.resolveToken(actingUser))) return false;

      if (!row.githubIssueNumber) {
        return (
          (await GithubIssueService.createIssueForTask(taskId, actingUser)) !==
          null
        );
      }

      const hasPushedField = Object.values(updates).some(
        (value) => value !== undefined,
      );
      if (!hasPushedField) return true;

      const issueUrl = `${GITHUB_API_URL}/repos/${owner}/${repo}/issues/${row.githubIssueNumber}`;
      const patch: Record<string, unknown> = {};
      if (updates.title !== undefined) patch.title = updates.title;
      if (updates.description !== undefined) {
        patch.body = updates.description ?? "";
      }
      if (updates.status !== undefined) {
        Object.assign(patch, issueStateForStatus(updates.status));
      }
      if (updates.status !== undefined || updates.priority !== undefined) {
        patch.labels = mergeIssueLabels(
          await currentLabelNames(issueUrl, actingUser),
          {
            status: updates.status ?? row.status,
            priority: updates.priority ?? row.priority,
          },
        );
      }
      if (updates.assigneeId !== undefined) {
        const login = updates.assigneeId
          ? await loginForAssignee(updates.assigneeId, owner, repo, actingUser)
          : null;
        patch.assignees = login ? [login] : [];
      }

      const res = await sendJson(issueUrl, "PATCH", patch, actingUser);
      return res.ok;
    } catch (error) {
      console.warn("Failed to sync task to GitHub issue:", error);
      return false;
    }
  }
}
