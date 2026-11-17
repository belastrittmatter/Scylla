import {
  GITHUB_API_URL,
  GithubAuthService,
} from "@/services/github/github-auth-service";
import { getTaskGithubContext } from "@/services/github/github-task-context";

export interface GithubIssueComment {
  id: number;
  body: string;
  htmlUrl: string;
  createdAt: Date;
  updatedAt: Date;
  author: { id: number; login: string; avatarUrl: string } | null;
}

interface RawIssueComment {
  id: number;
  body?: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  user?: { id: number; login: string; avatar_url: string } | null;
}

interface IssueTarget {
  url: string;
  actingUserId: string | undefined;
}

async function resolveTarget(
  taskId: string,
  userId?: string,
): Promise<IssueTarget | null> {
  const ctx = await getTaskGithubContext(taskId);
  const issueNumber = ctx?.task.githubIssueNumber;
  if (!ctx || !issueNumber) return null;
  const actingUserId = userId ?? ctx.task.creatorId ?? undefined;
  const token = await GithubAuthService.resolveToken(actingUserId);
  if (!token) return null;
  return {
    url: `${GITHUB_API_URL}/repos/${ctx.owner}/${ctx.repo}/issues/${issueNumber}/comments`,
    actingUserId,
  };
}

export class GithubCommentService {
  static async listIssueComments(
    taskId: string,
    userId?: string,
  ): Promise<GithubIssueComment[]> {
    try {
      const target = await resolveTarget(taskId, userId);
      if (!target) return [];
      const res = await GithubAuthService.fetchWithAuth(
        `${target.url}?per_page=100`,
        {},
        target.actingUserId,
      );
      if (!res.ok) return [];
      const raw = (await res.json()) as RawIssueComment[];
      return raw.map((c) => ({
        id: c.id,
        body: c.body ?? "",
        htmlUrl: c.html_url,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
        author: c.user
          ? {
              id: c.user.id,
              login: c.user.login,
              avatarUrl: c.user.avatar_url,
            }
          : null,
      }));
    } catch (error) {
      console.warn("GitHub comment list failed", error);
      return [];
    }
  }

  static async createIssueComment(
    taskId: string,
    content: string,
    userId?: string,
  ): Promise<{ id: number; htmlUrl: string } | null> {
    try {
      const target = await resolveTarget(taskId, userId);
      if (!target) return null;
      const res = await GithubAuthService.fetchWithAuth(
        target.url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: content }),
        },
        target.actingUserId,
      );
      if (!res.ok) return null;
      const data = (await res.json()) as RawIssueComment;
      return { id: data.id, htmlUrl: data.html_url };
    } catch (error) {
      console.warn("GitHub comment create failed", error);
      return null;
    }
  }
}
