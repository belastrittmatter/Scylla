import { parseTimestampMs } from "./task-utils";
import type { TaskItem, TaskStatus } from "./task-types";

/** Returns `task` with the new status and its time-tracking fields updated. */
export function withStatus(
  task: TaskItem,
  status: TaskStatus,
  now: Date = new Date(),
): TaskItem {
  let totalSpentSeconds = task.totalSpentSeconds || 0;
  let activeSessionStartedAt = task.activeSessionStartedAt;
  if (status === "in_progress" && task.status !== "in_progress") {
    activeSessionStartedAt = now.toISOString();
  } else if (task.status === "in_progress" && status !== "in_progress") {
    if (activeSessionStartedAt) {
      const elapsed = Math.round(
        (now.getTime() - parseTimestampMs(activeSessionStartedAt)) / 1000,
      );
      // Anti-spam filter: discard optimistic elapsed time if moved out in < 1 minute
      if (elapsed >= 60) totalSpentSeconds += elapsed;
    }
    activeSessionStartedAt = null;
  }
  return {
    ...task,
    status,
    totalSpentSeconds,
    activeSessionStartedAt,
    updatedAt: now,
  };
}

/**
 * Moves a task to `status`, placed before `beforeTaskId` in the global list
 * (null/undefined/unknown = end), so filtered column indexes never leak in.
 */
export function moveTaskInList(
  tasks: TaskItem[],
  taskId: string,
  status: TaskStatus,
  beforeTaskId?: string | null,
): TaskItem[] {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return tasks;
  const rest = tasks.filter((t) => t.id !== taskId);
  const at = rest.findIndex((t) => t.id === beforeTaskId);
  rest.splice(at === -1 ? rest.length : at, 0, withStatus(task, status));
  return rest;
}
