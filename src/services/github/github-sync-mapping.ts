import type { Task } from "@/db/schema";
import type { TaskPriority, TaskStatus } from "@/services/task/task-types";
import {
  priorityFromLabels,
  statusFromIssue,
  type GithubLabelInput,
} from "./github-labels";

export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 5000;

export interface GithubIssueItem {
  number: number;
  title?: string | null;
  body?: string | null;
  state: string;
  state_reason?: string | null;
  html_url: string;
  labels?: GithubLabelInput | null;
  pull_request?: unknown;
}

export interface SyncProjectContext {
  id: string;
  teamId: string;
  githubRepo: string;
}

export interface SyncedTaskFields {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  githubRepo: string;
  githubIssueNumber: number;
  githubIssueUrl: string;
}

type ExistingTask = Pick<Task, "status" | "priority">;

/** Pure mapping from a GitHub issue to the task columns a sync writes. */
export function mapIssueToTaskFields(
  issue: GithubIssueItem,
  project: SyncProjectContext,
  existing?: ExistingTask | null,
): SyncedTaskFields {
  const title =
    (issue.title ?? "").trim().slice(0, MAX_TITLE_LENGTH) || "Untitled issue";
  const fromIssue = statusFromIssue(issue);
  const priority = priorityFromLabels(issue.labels);
  let status: TaskStatus;
  if (!existing) status = fromIssue ?? "todo";
  else if (fromIssue) status = fromIssue;
  else
    status =
      existing.status === "done" || existing.status === "cancelled"
        ? "todo"
        : (existing.status as TaskStatus);
  return {
    title,
    description: issue.body
      ? issue.body.slice(0, MAX_DESCRIPTION_LENGTH)
      : null,
    status,
    priority: priority ?? (existing?.priority as TaskPriority) ?? "medium",
    githubRepo: project.githubRepo,
    githubIssueNumber: issue.number,
    githubIssueUrl: issue.html_url,
  };
}
