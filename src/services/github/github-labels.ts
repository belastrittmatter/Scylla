import type { TaskPriority, TaskStatus } from "@/services/task/task-types";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "status: todo",
  in_progress: "status: in progress",
  in_review: "status: in review",
  done: "status: done",
  cancelled: "status: cancelled",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "priority: low",
  medium: "priority: medium",
  high: "priority: high",
  urgent: "priority: urgent",
};

export type GithubLabelInput = Array<string | { name?: string | null }>;

export function labelNames(
  labels: GithubLabelInput | null | undefined,
): string[] {
  const names: string[] = [];
  for (const label of labels ?? []) {
    const name = typeof label === "string" ? label : label?.name;
    if (typeof name === "string" && name.trim()) names.push(name.trim());
  }
  return names;
}

function keyForLabel<K extends string>(
  table: Record<K, string>,
  name: string,
): K | null {
  const lower = name.toLowerCase();
  for (const key of Object.keys(table) as K[]) {
    if (table[key] === lower) return key;
  }
  return null;
}

export function statusFromIssue(issue: {
  state: string;
  state_reason?: string | null;
  labels?: GithubLabelInput | null;
}): TaskStatus | null {
  const names = labelNames(issue.labels).map((n) => n.toLowerCase());
  if (issue.state === "closed") {
    return names.includes(STATUS_LABELS.cancelled) ||
      issue.state_reason === "not_planned"
      ? "cancelled"
      : "done";
  }
  if (issue.state !== "open") return null;
  for (const name of names) {
    const status = keyForLabel(STATUS_LABELS, name);
    if (status === "todo" || status === "in_progress" || status === "in_review")
      return status;
  }
  return null;
}

export function priorityFromLabels(
  labels: GithubLabelInput | null | undefined,
): TaskPriority | null {
  for (const name of labelNames(labels)) {
    const priority = keyForLabel(PRIORITY_LABELS, name.toLowerCase());
    if (priority) return priority;
  }
  return null;
}

export function mergeTaskLabels(
  current: string[],
  status?: TaskStatus,
  priority?: TaskPriority,
): string[] {
  const kept = current.filter((name) => {
    const lower = name.toLowerCase();
    if (status && lower.startsWith("status:")) return false;
    if (priority && lower.startsWith("priority:")) return false;
    return true;
  });
  if (status) kept.push(STATUS_LABELS[status]);
  if (priority) kept.push(PRIORITY_LABELS[priority]);
  return kept;
}

export function issueStateForStatus(status: TaskStatus): {
  state: "open" | "closed";
  state_reason: "completed" | "not_planned" | null;
} {
  if (status === "done") return { state: "closed", state_reason: "completed" };
  if (status === "cancelled")
    return { state: "closed", state_reason: "not_planned" };
  return { state: "open", state_reason: null };
}
