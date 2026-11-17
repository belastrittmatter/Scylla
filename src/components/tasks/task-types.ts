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

/** Optional pre-filled dates for a new draft task. */
export type TaskDraftDates = { startDate: Date | null; dueDate: Date | null };

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

/** Single source for status labels (menus, rows); icons and tones live in task-status-icon. */
export const TASK_FORM_STATUSES = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
] as const;

/** Priority labels; urgent/high render through getQuietPriority, never a loud hue. */
export const TASK_FORM_PRIORITIES = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;

export interface TaskDrawerFormProps {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  startDateStr: string;
  dueDateStr: string;
  estimatedMinutes: number;
  users: TaskUser[];
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onStatusChange: (v: TaskStatus) => void;
  onPriorityChange: (v: TaskPriority) => void;
  onAssigneeChange: (v: string) => void;
  onStartDateChange: (v: string) => void;
  onDueDateChange: (v: string) => void;
  onEstimatedMinutesChange: (v: number) => void;
}

export const KANBAN_COLUMNS: Array<{ id: TaskStatus; title: string }> =
  TASK_FORM_STATUSES.filter((s) => s.value !== "cancelled").map((s) => ({
    id: s.value,
    title: s.label,
  }));
