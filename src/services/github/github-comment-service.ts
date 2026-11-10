import { db } from "@/db";
import { task, project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GithubAuthService } from "./github-auth-service";

export interface GitHubIssueCommentItem {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  source: "github";
  htmlUrl?: string;
  githubCommentId?: string | null;
  isSyncedToGithub?: boolean;
  user: {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string;
    initials?: string;
  };
}

export class GithubCommentService {
  /**
   * Fetches GitHub Issue comments for a task if linked to a GitHub Issue.
   */
  public static async getIssueComments(
    taskId: string,
    userId?: string,
  ): Promise<GitHubIssueCommentItem[]> {
    const [taskRecord] = await db
      .select()
      .from(task)
      .where(eq(task.id, taskId))
      .limit(1);

    if (!taskRecord?.githubIssueNumber || !taskRecord.projectId) {
      return [];
    }

    const [projectRecord] = await db
      .select()
      .from(project)
      .where(eq(project.id, taskRecord.projectId))
      .limit(1);

    if (!projectRecord?.githubRepo?.trim()) {
      return [];
    }

    const [owner, repo] = projectRecord.githubRepo.trim().split("/");
    const targetUserId = userId || taskRecord.creatorId;
    const token = await GithubAuthService.resolveToken(targetUserId);
    if (!token) {
      return [];
    }

    try {
      const res = await GithubAuthService.fetchWithAuth(
        `https://api.github.com/repos/${owner}/${repo}/issues/${taskRecord.githubIssueNumber}/comments?per_page=100`,
        {},
        targetUserId,
      );

      if (!res.ok) {
        return [];
      }

      const comments = (await res.json()) as Array<{
        id: number;
        body: string;
        created_at: string;
        updated_at: string;
        html_url: string;
        user?: {
          id: number;
          login: string;
          avatar_url: string;
          html_url: string;
        };
      }>;

      return comments.map((c) => ({
        id: `gh-${c.id}`,
        taskId,
        userId: c.user ? `gh-user-${c.user.id}` : "",
        content: c.body || "",
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at || c.created_at),
        source: "github" as const,
        htmlUrl: c.html_url,
        githubCommentId: String(c.id),
        isSyncedToGithub: true,
        user: {
          id: c.user ? `gh-user-${c.user.id}` : "",
          name: c.user?.login || "GitHub User",
          avatarUrl: c.user?.avatar_url || "",
          initials: (c.user?.login || "GH").slice(0, 2).toUpperCase(),
        },
      }));
    } catch (err) {
      console.warn(`Failed to fetch GitHub comments for task ${taskId}:`, err);
      return [];
    }
  }

  /**
   * Posts a comment directly to the linked GitHub Issue.
   */
  public static async createIssueComment(
    taskId: string,
    content: string,
    userId?: string,
  ): Promise<{ success: boolean; id?: number; htmlUrl?: string }> {
    const [taskRecord] = await db
      .select()
      .from(task)
      .where(eq(task.id, taskId))
      .limit(1);

    if (!taskRecord?.githubIssueNumber || !taskRecord.projectId) {
      return { success: false };
    }

    const [projectRecord] = await db
      .select()
      .from(project)
      .where(eq(project.id, taskRecord.projectId))
      .limit(1);

    if (!projectRecord?.githubRepo?.trim()) {
      return { success: false };
    }

    const [owner, repo] = projectRecord.githubRepo.trim().split("/");
    const targetUserId = userId || taskRecord.creatorId;
    const token = await GithubAuthService.resolveToken(targetUserId);
    if (!token) {
      return { success: false };
    }

    try {
      const res = await GithubAuthService.fetchWithAuth(
        `https://api.github.com/repos/${owner}/${repo}/issues/${taskRecord.githubIssueNumber}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: content,
          }),
        },
        targetUserId,
      );

      if (!res.ok) {
        return { success: false };
      }

      const json = (await res.json()) as { id: number; html_url: string };
      return {
        success: true,
        id: json.id,
        htmlUrl: json.html_url,
      };
    } catch (err) {
      console.warn(`Failed to post comment to GitHub for task ${taskId}:`, err);
      return { success: false };
    }
  }
}
