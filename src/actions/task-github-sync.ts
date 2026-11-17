import type { Task } from "@/db/schema";
import {
  GithubIntegrationService,
  type SyncTaskToGitHubUpdates,
} from "@/services/github/github-integration-service";

export interface TaskSyncSnapshot {
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeId: string | null;
}

const SYNC_KEYS = [
  "title",
  "description",
  "status",
  "priority",
  "assigneeId",
] as const;

/** Creates the task's GitHub issue and merges its number and URL into the task. Never throws. */
export async function pushNewTaskToGithub(
  task: Task,
  userId: string,
): Promise<Task> {
  try {
    const issue = await GithubIntegrationService.createIssueForTask(
      task.id,
      userId,
    );
    if (!issue) return task;
    return {
      ...task,
      githubIssueNumber: issue.number,
      githubIssueUrl: issue.url,
    };
  } catch (err) {
    console.warn("GitHub issue creation failed", err);
    return task;
  }
}

/** Pushes only the defined fields that differ from `before`. Never throws. */
export async function pushTaskChangesToGithub(
  before: TaskSyncSnapshot,
  changes: SyncTaskToGitHubUpdates,
  taskId: string,
  userId: string,
): Promise<void> {
  const updates: Record<string, string | null> = {};
  for (const key of SYNC_KEYS) {
    const value = changes[key];
    if (value !== undefined && value !== before[key]) updates[key] = value;
  }
  if (Object.keys(updates).length === 0) return;
  try {
    await GithubIntegrationService.syncTaskToGitHub(
      taskId,
      updates as SyncTaskToGitHubUpdates,
      userId,
    );
  } catch (err) {
    console.warn("GitHub task sync failed", err);
  }
}
