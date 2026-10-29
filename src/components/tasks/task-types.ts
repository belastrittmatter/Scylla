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

export interface ProjectWithStats extends Project {
  taskCount?: number;
  completedCount?: number;
}

export interface TeamWithStats extends Team {
  memberCount?: number;
  projectCount?: number;
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

export const TASK_FORM_STATUSES = [
  { value: "todo", label: "To Do", dot: "bg-slate-400" },
  { value: "in_progress", label: "In Progress", dot: "bg-blue-500" },
  { value: "in_review", label: "In Review", dot: "bg-amber-500" },
  { value: "done", label: "Done", dot: "bg-emerald-500" },
  { value: "cancelled", label: "Cancelled", dot: "bg-rose-500" },
] as const;

export const TASK_FORM_PRIORITIES = [
  { value: "urgent", label: "Urgent", color: "text-rose-600 font-semibold" },
  { value: "high", label: "High", color: "text-orange-600 font-medium" },
  { value: "medium", label: "Medium", color: "text-amber-600" },
  { value: "low", label: "Low", color: "text-neutral-500" },
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

export const KANBAN_COLUMNS: Array<{
  id: TaskStatus;
  title: string;
  color: string;
  badgeClass: string;
}> = [
  {
    id: "todo",
    title: "To Do",
    color: "#94a3b8",
    badgeClass:
      "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
  },
  {
    id: "in_progress",
    title: "In Progress",
    color: "#3b82f6",
    badgeClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    id: "in_review",
    title: "In Review",
    color: "#8b5cf6",
    badgeClass:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  {
    id: "done",
    title: "Done",
    color: "#10b981",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
];
