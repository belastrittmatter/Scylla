import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { task } from "@/db/schema";
import type { Task } from "@/db/schema";
import { parseGithubRepo } from "@/lib/github-validation";
import {
  GITHUB_API_URL,
  GithubAuthService,
} from "@/services/github/github-auth-service";
import {
  isPrLinkedToIssue,
  mapGitHubPrState,
} from "@/services/github/github-dev-utils";
import {
  priorityFromLabels,
  statusFromIssue,
} from "@/services/github/github-labels";
import { ProjectService } from "@/services/project/project-service";
import { TaskService } from "@/services/task/task-service";
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  type TaskPriority,
  type UpdateTaskInput,
} from "@/services/task/task-types";

export interface SyncResult {
  repository: string;
  createdCount: number;
  updatedCount: number;
  totalIssues: number;
}

interface GithubIssue {
  number: number;
  title?: string | null;
  body?: string | null;
  state: string;
  state_reason?: string | null;
  html_url: string;
  labels?: ReadonlyArray<string | { name?: string | null }>;
  pull_request?: unknown;
}

interface GithubPull {
  number: number;
  title?: string | null;
  body?: string | null;
  html_url: string;
  state: string;
  draft?: boolean | null;
  merged_at?: string | null;
  head?: { ref?: string | null } | null;
}

interface Touched {
  taskId: string;
  issueNumber: number;
  branch: string | null;
}

const inFlight = new Map<string, Promise<void>>();

function labelNames(issue: GithubIssue): string[] {
  const names: string[] = [];
  for (const label of issue.labels ?? []) {
    const name = typeof label === "string" ? label : label.name;
    if (name) names.push(name);
  }
  return names;
}

async function fetchList<T>(
  url: string,
  userId: string | undefined,
): Promise<{ ok: true; items: T[] } | { ok: false; status: number }> {
  const res = await GithubAuthService.fetchWithAuth(url, {}, userId);
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, items: (await res.json()) as T[] };
}

function changedFields(
  existing: Task,
  issue: GithubIssue,
  labels: string[],
): UpdateTaskInput {
  const title = (issue.title ?? "").trim().slice(0, 200) || "Untitled issue";
  const body = issue.body
    ? issue.body.slice(0, TASK_DESCRIPTION_MAX_LENGTH)
    : null;
  const status = statusFromIssue(
    { state: issue.state, state_reason: issue.state_reason, labels },
    existing.status,
  );
  const priority =
    priorityFromLabels(labels) ?? (existing.priority as TaskPriority);
  const changes: UpdateTaskInput = {};
  if (title !== existing.title) changes.title = title;
  if (body !== (existing.description ?? null)) changes.description = body;
  if (status !== existing.status) changes.status = status;
  if (priority !== existing.priority) changes.priority = priority;
  return changes;
}

async function syncIssue(
  issue: GithubIssue,
  projectId: string,
  teamId: string,
  ownerId: string,
): Promise<{ touched: Touched; created: boolean } | null> {
  const labels = labelNames(issue);
  const existing = await db.query.task.findFirst({
    where: and(
      eq(task.projectId, projectId),
      eq(task.githubIssueNumber, issue.number),
    ),
  });

  if (existing) {
    const changes = changedFields(existing, issue, labels);
    if (Object.keys(changes).length > 0) {
      await TaskService.updateTask(existing.id, changes, ownerId);
    }
    if (existing.githubIssueUrl !== issue.html_url) {
      await db
        .update(task)
        .set({ githubIssueUrl: issue.html_url })
        .where(eq(task.id, existing.id));
    }
    return {
      created: false,
      touched: {
        taskId: existing.id,
        issueNumber: issue.number,
        branch: existing.githubBranch,
      },
    };
  }

  if (issue.state !== "open") return null;

  const title = (issue.title ?? "").trim().slice(0, 200) || "Untitled issue";
  const body = issue.body
    ? issue.body.slice(0, TASK_DESCRIPTION_MAX_LENGTH)
    : "";
  const created = await TaskService.createTask({
    title,
    ...(body ? { description: body } : {}),
    status: statusFromIssue(
      { state: issue.state, state_reason: issue.state_reason, labels },
      null,
    ),
    priority: priorityFromLabels(labels) ?? "medium",
    teamId,
    projectId,
    creatorId: ownerId,
  });
  await db
    .update(task)
    .set({ githubIssueNumber: issue.number, githubIssueUrl: issue.html_url })
    .where(eq(task.id, created.id));
  return {
    created: true,
    touched: { taskId: created.id, issueNumber: issue.number, branch: null },
  };
}

async function linkPullRequests(
  pulls: GithubPull[],
  touched: Touched[],
): Promise<void> {
  for (const item of touched) {
    const pull = pulls.find((p) =>
      isPrLinkedToIssue(p, item.issueNumber, item.branch),
    );
    if (!pull) continue;
    await db
      .update(task)
      .set({
        githubPrNumber: pull.number,
        githubPrUrl: pull.html_url,
        githubPrStatus: mapGitHubPrState(pull),
      })
      .where(eq(task.id, item.taskId));
  }
}

export class GithubSyncService {
  static async syncProjectIssues(
    projectId: string,
    currentUserId?: string,
  ): Promise<SyncResult> {
    const project = await ProjectService.getProjectById(projectId);
    if (!project) throw new Error(`Project with id "${projectId}" not found`);
    const parsed = project.githubRepo
      ? parseGithubRepo(project.githubRepo)
      : null;
    if (!project.githubRepo || !parsed) {
      throw new Error("Project is not linked to any GitHub repository");
    }

    const team = await db.query.team.findFirst({
      where: (t, { eq: equals }) => equals(t.id, project.teamId),
    });
    if (!team) throw new Error(`Team for project "${projectId}" not found`);

    const base = `${GITHUB_API_URL}/repos/${parsed.owner}/${parsed.repo}`;
    const issuesRes = await fetchList<GithubIssue>(
      `${base}/issues?state=all&per_page=100`,
      currentUserId,
    );
    if (!issuesRes.ok) {
      throw new Error(`GitHub API returned ${issuesRes.status}`);
    }

    let createdCount = 0;
    let updatedCount = 0;
    const touched: Touched[] = [];
    for (const issue of issuesRes.items) {
      if (issue.pull_request) continue;
      const outcome = await syncIssue(
        issue,
        projectId,
        project.teamId,
        team.ownerId,
      );
      if (!outcome) continue;
      if (outcome.created) createdCount++;
      else updatedCount++;
      touched.push(outcome.touched);
    }

    const pullsRes = await fetchList<GithubPull>(
      `${base}/pulls?state=all&per_page=100`,
      currentUserId,
    );
    if (pullsRes.ok) await linkPullRequests(pullsRes.items, touched);

    return {
      repository: project.githubRepo,
      createdCount,
      updatedCount,
      totalIssues: createdCount + updatedCount,
    };
  }

  static syncProjectIssuesInBackground(
    projectId: string,
    currentUserId?: string,
  ): Promise<void> {
    const running = inFlight.get(projectId);
    if (running) return running;
    const promise = GithubSyncService.syncProjectIssues(
      projectId,
      currentUserId,
    )
      .then(() => undefined)
      .catch((error: unknown) => {
        console.warn(
          `GitHub background sync failed for project ${projectId}:`,
          error,
        );
      })
      .finally(() => {
        inFlight.delete(projectId);
      });
    inFlight.set(projectId, promise);
    return promise;
  }

  static async waitForBackgroundSyncs(): Promise<void> {
    while (inFlight.size > 0) {
      await Promise.all([...inFlight.values()]);
    }
  }
}
