import { db } from "@/db";
import { task, project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GithubAuthService } from "./github-auth-service";
import {
  type CreateIssueResult,
  type SyncTaskToGitHubUpdates,
  generateBranchName,
} from "./github-dev-utils";
import { GithubUserResolver } from "./github-user-resolver";
import { GithubIssueAssigneeService } from "./github-issue-assignee-service";

export class GithubIssueService {
  /**
   * Creates a GitHub issue for a given Scylla task and saves issue number & URL.
   */
  public static async createIssueForTask(
    taskId: string,
    userId?: string,
  ): Promise<CreateIssueResult | null> {
    const [taskRecord] = await db
      .select()
      .from(task)
      .where(eq(task.id, taskId))
      .limit(1);

    if (!taskRecord || !taskRecord.projectId) return null;

    const [projectRecord] = await db
      .select()
      .from(project)
      .where(eq(project.id, taskRecord.projectId))
      .limit(1);

    if (!projectRecord?.githubRepo?.trim()) return null;

    const parts = projectRecord.githubRepo.trim().split("/");
    if (parts.length !== 2) return null;
    const [owner, repo] = parts;

    const targetUserId = userId || taskRecord.creatorId;
    const token = await GithubAuthService.resolveToken(targetUserId);
    if (!token) {
      console.warn("No GitHub access token available to create issue");
      return null;
    }

    const labels = [`priority:${taskRecord.priority || "medium"}`];
    if (taskRecord.status === "in_progress") labels.push("status:in-progress");
    else if (taskRecord.status === "in_review") labels.push("status:in-review");
    else if (taskRecord.status === "done") labels.push("status:done");

    const bodyContent = `${taskRecord.description || ""}\n\n---\n*Created via Scylla Task Board*`;

    let assigneeUsernames: string[] = [];
    if (taskRecord.assigneeId) {
      const ghUsername = await GithubUserResolver.resolveGitHubUsername(
        taskRecord.assigneeId,
        targetUserId,
      );
      if (ghUsername) {
        await GithubUserResolver.inviteCollaborator(
          owner,
          repo,
          ghUsername,
          targetUserId,
        );
        assigneeUsernames = [ghUsername];
      }
    }

    const issuePayload: Record<string, unknown> = {
      title: taskRecord.title,
      body: bodyContent,
      labels,
    };
    if (assigneeUsernames.length > 0) {
      issuePayload.assignees = assigneeUsernames;
    }

    let res = await GithubAuthService.fetchWithAuth(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(issuePayload),
      },
      targetUserId,
    );

    if (!res.ok && res.status === 422 && assigneeUsernames.length > 0) {
      const fallbackPayload = { ...issuePayload };
      delete fallbackPayload.assignees;
      res = await GithubAuthService.fetchWithAuth(
        `https://api.github.com/repos/${owner}/${repo}/issues`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fallbackPayload),
        },
        targetUserId,
      );
    }

    if (!res.ok) {
      const err = await res.text();
      console.error(`Failed to create GitHub issue: ${res.statusText}`, err);
      return null;
    }

    const createdIssue = (await res.json()) as {
      number: number;
      html_url: string;
    };
    const branchName = generateBranchName(
      createdIssue.number,
      taskRecord.title,
    );

    await db
      .update(task)
      .set({
        githubIssueNumber: createdIssue.number,
        githubIssueUrl: createdIssue.html_url,
      })
      .where(eq(task.id, taskId));

    return {
      number: createdIssue.number,
      url: createdIssue.html_url,
      branchName,
    };
  }

  /**
   * Updates state of the linked GitHub issue when task status changes in Scylla.
   */
  public static async updateIssueState(
    taskId: string,
    status: string,
    userId?: string,
  ): Promise<boolean> {
    const [taskRecord] = await db
      .select()
      .from(task)
      .where(eq(task.id, taskId))
      .limit(1);

    if (!taskRecord || !taskRecord.githubIssueNumber || !taskRecord.projectId) {
      return false;
    }

    const [projectRecord] = await db
      .select()
      .from(project)
      .where(eq(project.id, taskRecord.projectId))
      .limit(1);

    if (!projectRecord?.githubRepo?.trim()) return false;

    const [owner, repo] = projectRecord.githubRepo.trim().split("/");
    const targetUserId = userId || taskRecord.creatorId;
    const token = await GithubAuthService.resolveToken(targetUserId);
    if (!token) return false;

    const isClosing = ["done", "cancelled", "closed"].includes(status);
    const state = isClosing ? "closed" : "open";
    const stateReason =
      status === "cancelled"
        ? "not_planned"
        : isClosing
          ? "completed"
          : "reopened";

    try {
      const res = await GithubAuthService.fetchWithAuth(
        `https://api.github.com/repos/${owner}/${repo}/issues/${taskRecord.githubIssueNumber}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state, state_reason: stateReason }),
        },
        targetUserId,
      );
      return res.ok;
    } catch (e) {
      console.warn("Failed to update GitHub issue state:", e);
      return false;
    }
  }

  /**
   * Updates assignee on the linked GitHub Issue.
   */
  public static async updateIssueAssignee(
    taskId: string,
    newAssigneeId: string | null,
    userId?: string,
  ): Promise<boolean> {
    return GithubIssueAssigneeService.updateIssueAssignee(
      taskId,
      newAssigneeId,
      userId,
    );
  }

  /**
   * Synchronizes task updates to the linked GitHub Issue.
   */
  public static async syncTaskToGitHub(
    taskId: string,
    updates: SyncTaskToGitHubUpdates,
    userId?: string,
  ): Promise<boolean> {
    const [taskRecord] = await db
      .select()
      .from(task)
      .where(eq(task.id, taskId))
      .limit(1);
    if (!taskRecord || !taskRecord.projectId) return false;

    const [projectRecord] = await db
      .select()
      .from(project)
      .where(eq(project.id, taskRecord.projectId))
      .limit(1);
    if (!projectRecord?.githubRepo?.trim()) return false;

    const targetUserId = userId || taskRecord.creatorId;
    if (!taskRecord.githubIssueNumber) {
      const createdIssue = await this.createIssueForTask(taskId, targetUserId);
      return !!createdIssue;
    }

    const [owner, repo] = projectRecord.githubRepo.trim().split("/");
    const patchPayload: Record<string, unknown> = {};

    if (updates.title !== undefined) patchPayload.title = updates.title;
    if (updates.description !== undefined) {
      patchPayload.body = `${updates.description || ""}\n\n---\n*Created via Scylla Task Board*`;
    }
    if (updates.priority !== undefined) {
      patchPayload.labels = [`priority:${updates.priority}`];
    }
    if (updates.status !== undefined) {
      const isClosing = ["done", "cancelled", "closed"].includes(
        updates.status,
      );
      patchPayload.state = isClosing ? "closed" : "open";
      patchPayload.state_reason =
        updates.status === "cancelled"
          ? "not_planned"
          : isClosing
            ? "completed"
            : "reopened";
    }

    if (updates.assigneeId !== undefined) {
      const ghUsername = updates.assigneeId
        ? await GithubUserResolver.resolveGitHubUsername(
            updates.assigneeId,
            targetUserId,
          )
        : null;
      patchPayload.assignees = ghUsername ? [ghUsername] : [];
    }

    try {
      const token = await GithubAuthService.resolveToken(targetUserId);
      if (!token) return false;

      let ok = true;
      if (Object.keys(patchPayload).length > 0) {
        const res = await GithubAuthService.fetchWithAuth(
          `https://api.github.com/repos/${owner}/${repo}/issues/${taskRecord.githubIssueNumber}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patchPayload),
          },
          targetUserId,
        );
        ok = res.ok;
      }

      if (updates.assigneeId !== undefined) {
        await this.updateIssueAssignee(
          taskId,
          updates.assigneeId,
          targetUserId,
        );
      }

      return ok;
    } catch (err) {
      console.warn("Failed to sync task to GitHub issue:", err);
      return false;
    }
  }
}
