import { eq } from "drizzle-orm";
import { db } from "@/db";
import { project, task } from "@/db/schema";
import type { Project, Task } from "@/db/schema";
import { parseGithubRepoFullName } from "@/lib/github-validation";

export interface GithubTaskContext {
  task: Task;
  project: Project | null;
  owner: string;
  repo: string;
  fullName: string;
}

export async function loadTask(taskId: string): Promise<Task | null> {
  const [row] = await db.select().from(task).where(eq(task.id, taskId));
  return row ?? null;
}

/** Task, project and parsed repository, or null when not linked. */
export async function loadTaskContext(
  taskId: string,
): Promise<GithubTaskContext | null> {
  const row = await loadTask(taskId);
  return row ? contextForTask(row) : null;
}

export async function contextForTask(
  row: Task,
): Promise<GithubTaskContext | null> {
  let proj: Project | null = null;
  if (row.projectId) {
    const [found] = await db
      .select()
      .from(project)
      .where(eq(project.id, row.projectId));
    proj = found ?? null;
  }
  const parsed = parseGithubRepoFullName(row.githubRepo ?? proj?.githubRepo);
  if (!parsed) return null;
  return {
    task: row,
    project: proj,
    ...parsed,
    fullName: `${parsed.owner}/${parsed.repo}`,
  };
}

export function repoApiUrl(ctx: { owner: string; repo: string }): string {
  return `https://api.github.com/repos/${ctx.owner}/${ctx.repo}`;
}

export function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
