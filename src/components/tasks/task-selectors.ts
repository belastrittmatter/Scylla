import { canDeleteTask } from "@/services/task/task-permissions";
import type { WorkspaceTeamMember } from "@/services/task/workspace-types";
import { TASK_FORM_STATUSES } from "./task-types";
import type { TaskItem, TaskStatus, Team } from "./task-types";

export type TaskScope = "me" | "team";

export interface SelectScopedTasksArgs {
  tasks: TaskItem[];
  scope: TaskScope;
  userId?: string | null;
  teamId?: string | null;
  projectId?: string | null;
}

export function selectScopedTasks({
  tasks,
  scope,
  userId,
  teamId,
  projectId,
}: SelectScopedTasksArgs): TaskItem[] {
  if (scope === "me") {
    return userId ? tasks.filter((t) => t.assigneeId === userId) : [];
  }
  if (!teamId) return [];
  // No project = all projects of the team.
  return tasks.filter(
    (t) => t.teamId === teamId && (!projectId || t.projectId === projectId),
  );
}

/** Me (list-first) hides finished work until the user picks a status explicitly. */
export function hideClosedTasks(
  tasks: TaskItem[],
  statusFilter: TaskStatus | "all",
): TaskItem[] {
  if (statusFilter !== "all") return tasks;
  return tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
}

export type DeadlineBucket =
  "overdue" | "today" | "upcoming7" | "later" | "no_date";

/** Local-time buckets: overdue < today, today, next 7 days, later. */
export function getDeadlineBucket(
  dueDate: Date | string | null | undefined,
  now: Date = new Date(),
): DeadlineBucket {
  if (!dueDate) return "no_date";
  const day = (offset: number) =>
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset,
    ).getTime();
  const due = new Date(dueDate).getTime();
  if (due < day(0)) return "overdue";
  if (due < day(1)) return "today";
  return due < day(8) ? "upcoming7" : "later";
}

export interface TaskListGroup {
  id: string;
  label: string;
  tasks: TaskItem[];
  destructive: boolean;
}

const DEADLINE_GROUPS: Array<{ id: DeadlineBucket; label: string }> = [
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "upcoming7", label: "Next 7 days" },
  { id: "later", label: "Later" },
  { id: "no_date", label: "No date" },
];

const dueTime = (t: TaskItem) =>
  t.dueDate ? new Date(t.dueDate).getTime() : Infinity;

/** Non-empty list groups (by deadline or workflow status), each sorted by due date. */
export function groupTasksForList(
  tasks: TaskItem[],
  by: "deadline" | "status",
  now: Date = new Date(),
): TaskListGroup[] {
  const sorted = [...tasks].sort((a, b) => dueTime(a) - dueTime(b));
  const groups =
    by === "deadline"
      ? DEADLINE_GROUPS.map((g) => ({
          ...g,
          tasks: sorted.filter(
            (t) => getDeadlineBucket(t.dueDate, now) === g.id,
          ),
        }))
      : TASK_FORM_STATUSES.map((s) => ({
          id: s.value,
          label: s.label,
          tasks: sorted.filter((t) => t.status === s.value),
        }));
  return groups
    .filter((g) => g.tasks.length > 0)
    .map((g) => ({ ...g, destructive: g.id === "overdue" }));
}

/** Client mirror of the server delete rule; the API still enforces it. */
export function makeCanDeleteTask(
  teams: readonly Pick<Team, "id" | "ownerId">[],
  members: readonly WorkspaceTeamMember[],
  userId?: string | null,
): (task: TaskItem) => boolean {
  return (task) =>
    Boolean(userId) &&
    canDeleteTask({
      role: members.find((m) => m.teamId === task.teamId && m.userId === userId)
        ?.role,
      isTeamOwner: teams.find((t) => t.id === task.teamId)?.ownerId === userId,
    });
}
