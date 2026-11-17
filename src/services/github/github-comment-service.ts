import { GithubAuthService } from "./github-auth-service";
import { jsonInit, loadTaskContext, repoApiUrl } from "./github-task-context";
import type { GithubIssueComment } from "./github-types";

const { fetchWithAuth } = GithubAuthService;

interface RawComment {
  id: number;
  body: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  user?: { login?: string; avatar_url?: string } | null;
}

async function commentsUrl(taskId: string): Promise<string | null> {
  const ctx = await loadTaskContext(taskId);
  const n = ctx?.task.githubIssueNumber;
  return ctx && n != null ? `${repoApiUrl(ctx)}/issues/${n}/comments` : null;
}

export async function listIssueComments(
  taskId: string,
  userId?: string,
): Promise<GithubIssueComment[]> {
  const url = await commentsUrl(taskId);
  if (!url) return [];
  try {
    const res = await fetchWithAuth(`${url}?per_page=100`, {}, userId);
    if (!res.ok) {
      console.warn(`GitHub comments read failed: ${res.status}`);
      return [];
    }
    const raw = (await res.json()) as RawComment[];
    return raw.map((c) => ({
      id: String(c.id),
      body: c.body,
      htmlUrl: c.html_url,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      author: {
        login: c.user?.login ?? "ghost",
        avatarUrl: c.user?.avatar_url ?? null,
      },
    }));
  } catch (error) {
    console.warn("GitHub comments read failed", error);
    return [];
  }
}

export async function createIssueComment(
  taskId: string,
  body: string,
  userId?: string,
): Promise<{ id: string; htmlUrl: string } | null> {
  const url = await commentsUrl(taskId);
  if (!url) return null;
  try {
    const res = await fetchWithAuth(url, jsonInit("POST", { body }), userId);
    if (!res.ok) {
      console.warn(`GitHub comment creation failed: ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { id: number; html_url: string };
    return { id: String(data.id), htmlUrl: data.html_url };
  } catch (error) {
    console.warn("GitHub comment creation failed", error);
    return null;
  }
}
