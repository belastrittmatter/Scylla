import type { TaskPriority, TaskStatus } from "@/services/task/task-types";

const STATUS_LABELS: Record<string, string> = {
  todo: "status:todo",
  in_progress: "status:in-progress",
  in_review: "status:in-review",
  done: "status:done",
  cancelled: "status:cancelled",
};

const PRIORITIES: readonly TaskPriority[] = ["low", "medium", "high", "urgent"];

export function isManagedLabel(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.startsWith("priority:") || lower.startsWith("status:");
}

export function buildManagedLabels(task: {
  status: string;
  priority: string;
}): string[] {
  return [
    `priority:${task.priority}`,
    STATUS_LABELS[task.status] ?? `status:${task.status}`,
  ];
}

export function mergeIssueLabels(
  existing: readonly string[],
  task: { status: string; priority: string },
): string[] {
  return [
    ...existing.filter((label) => !isManagedLabel(label)),
    ...buildManagedLabels(task),
  ];
}

export function priorityFromLabels(
  labels: readonly string[],
): TaskPriority | null {
  for (const label of labels) {
    const lower = label.toLowerCase();
    if (!lower.startsWith("priority:")) continue;
    const value = lower.slice("priority:".length) as TaskPriority;
    if (PRIORITIES.includes(value)) return value;
  }
  return null;
}

export function statusFromIssue(
  issue: {
    state: string;
    state_reason?: string | null;
    labels: readonly string[];
  },
  currentStatus?: string | null,
): TaskStatus {
  const labels = issue.labels.map((label) => label.toLowerCase());
  if (issue.state === "closed") {
    return issue.state_reason === "not_planned" ||
      labels.includes("status:cancelled")
      ? "cancelled"
      : "done";
  }
  if (labels.includes("status:in-review")) return "in_review";
  if (labels.includes("status:in-progress")) return "in_progress";
  if (labels.includes("status:todo")) return "todo";
  if (
    currentStatus === "todo" ||
    currentStatus === "in_progress" ||
    currentStatus === "in_review"
  ) {
    return currentStatus;
  }
  return "todo";
}

export function issueStateForStatus(status: string): {
  state: "open" | "closed";
  state_reason: "completed" | "not_planned" | "reopened";
} {
  if (status === "done") return { state: "closed", state_reason: "completed" };
  if (status === "cancelled") {
    return { state: "closed", state_reason: "not_planned" };
  }
  return { state: "open", state_reason: "reopened" };
}
