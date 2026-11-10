import type { Task, Project, Team, TaskComment } from "@/db/schema";
import type { TaskUser } from "@/services/task/task-types";

export type { TaskUser, Task, Project, Team, TaskComment };

export interface TaskCommentItem extends TaskComment {
  user?: TaskUser | null;
}

export type TaskStatus =
  "todo" | "in_progress" | "in_review" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type ProjectStatus =
  "planning" | "active" | "paused" | "completed" | "archived";

export interface TaskItem extends Task {
  assignee?: TaskUser | null;
  creator?: TaskUser | null;
  project?: Project | null;
  totalSpentSeconds?: number;
  activeSessionStartedAt?: string | null;
}

export type DeadlineHorizon =
  "all" | "overdue" | "today" | "upcoming" | "no_date";

export interface TaskFilters {
  searchQuery: string;
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  deadlineHorizon: DeadlineHorizon;
}

export const INITIAL_TASK_FILTERS: TaskFilters = {
  searchQuery: "",
  status: "all",
  priority: "all",
  deadlineHorizon: "all",
};

/** Single source for status labels and `dot` colours (menus, rows). */
export const TASK_FORM_STATUSES = [
  { value: "todo", label: "To Do", dot: "bg-muted-foreground" },
  { value: "in_progress", label: "In Progress", dot: "bg-blue-500" },
  { value: "in_review", label: "In Review", dot: "bg-purple-500" },
  { value: "done", label: "Done", dot: "bg-emerald-500" },
  { value: "cancelled", label: "Cancelled", dot: "bg-destructive/60" },
] as const;

export const TASK_FORM_PRIORITIES = [
  { value: "urgent", label: "Urgent", color: "text-destructive font-semibold" },
  { value: "high", label: "High", color: "text-primary font-medium" },
  { value: "medium", label: "Medium", color: "text-foreground" },
  { value: "low", label: "Low", color: "text-muted-foreground" },
] as const;

export interface TaskDrawerFormProps {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  dueDateStr: string;
  estimatedMinutes: number;
  users: TaskUser[];
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onStatusChange: (v: TaskStatus) => void;
  onPriorityChange: (v: TaskPriority) => void;
  onAssigneeChange: (v: string) => void;
  onDueDateChange: (v: string) => void;
  onEstimatedMinutesChange: (v: number) => void;
}

export const KANBAN_COLUMNS: Array<{ id: TaskStatus; title: string }> =
  TASK_FORM_STATUSES.filter((s) => s.value !== "cancelled").map((s) => ({
    id: s.value,
    title: s.label,
  }));
