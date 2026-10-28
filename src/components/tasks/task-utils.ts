import { format, isToday, isPast, isFuture } from "date-fns";
import type {
  TaskItem,
  TaskFilters,
  TaskPriority,
  TaskStatus,
  Project,
  TaskUser,
} from "./task-types";

// Palette for user avatar styling
const AVATAR_PALETTE = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-200 border-violet-300 dark:border-violet-700",
  "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200 border-blue-300 dark:border-blue-700",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700",
  "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-200 border-rose-300 dark:border-rose-800",
  "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300 dark:border-amber-700",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700",
];

export function getUserAvatarColor(name: string): string {
  if (!name) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

/**
 * Safely parses any database timestamp string or Date object into a standard UTC ISO-8601 string ("...Z").
 * Prevents timezone shift bugs where database timestamps without timezone offsets (e.g. "YYYY-MM-DD HH:mm:ss.sss")
 * are inadvertently parsed using the server or browser's local timezone.
 */
export function parseDbTimestampToIso(val: string | Date | null | undefined): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  const str = String(val).trim();
  if (!str) return null;
  if (str.endsWith("Z") || /[+-]\d{2}(:\d{2})?$/.test(str)) {
    return new Date(str).toISOString();
  }
  const normalized = str.replace(" ", "T");
  return new Date(normalized.endsWith("Z") ? normalized : `${normalized}Z`).toISOString();
}

/**
 * Safely parses a timestamp string or Date into epoch milliseconds in UTC.
 * If the input string lacks timezone info, treats it as UTC rather than local time.
 */
export function parseTimestampMs(val: string | number | Date | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (val instanceof Date) return val.getTime();
  const str = String(val).trim();
  if (!str) return 0;
  if (str.endsWith("Z") || /[+-]\d{2}(:\d{2})?$/.test(str)) {
    return new Date(str).getTime();
  }
  const normalized = str.replace(" ", "T");
  return new Date(normalized.endsWith("Z") ? normalized : `${normalized}Z`).getTime();
}

export function formatDueDate(date: Date | string | null | undefined): string {
  if (!date) return "No deadline";
  const d = typeof date === "string" ? new Date(date) : date;
  return isNaN(d.getTime()) ? "Invalid date" : format(d, "MMM d, yyyy");
}

export function getDeadlineStatus(
  date: Date | string | null | undefined,
  isCompleted: boolean = false
): {
  label: string;
  variant: "default" | "warning" | "destructive" | "muted";
  isOverdue: boolean;
  colorClass: string;
} {
  if (!date) {
    return {
      label: "No deadline",
      variant: "muted",
      isOverdue: false,
      colorClass: "text-neutral-400 dark:text-neutral-500",
    };
  }
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return {
      label: "Invalid date",
      variant: "muted",
      isOverdue: false,
      colorClass: "text-neutral-400",
    };
  }

  if (isCompleted) {
    return {
      label: format(d, "MMM d"),
      variant: "muted",
      isOverdue: false,
      colorClass: "text-neutral-500 dark:text-neutral-400",
    };
  }

  if (isPast(d) && !isToday(d)) {
    return {
      label: `Overdue (${format(d, "MMM d")})`,
      variant: "destructive",
      isOverdue: true,
      colorClass:
        "text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md font-semibold",
    };
  }
  const isDueToday = isToday(d);
  return {
    label: isDueToday ? "Due today" : format(d, "MMM d"),
    variant: isDueToday ? "warning" : "default",
    isOverdue: false,
    colorClass: isDueToday
      ? "text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md font-semibold"
      : "text-sky-700 bg-sky-50 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded-md font-medium",
  };
}

const PRIORITY_BADGES: Record<
  TaskPriority,
  { label: string; badgeClass: string; dotColor: string }
> = {
  urgent: {
    label: "Urgent",
    dotColor: "bg-rose-500",
    badgeClass:
      "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 border-rose-300 dark:border-rose-800 font-semibold",
  },
  high: {
    label: "High",
    dotColor: "bg-orange-500",
    badgeClass:
      "bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-200 border-orange-300 dark:border-orange-800 font-semibold",
  },
  medium: {
    label: "Medium",
    dotColor: "bg-sky-500",
    badgeClass:
      "bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-200 border-sky-300 dark:border-sky-800 font-medium",
  },
  low: {
    label: "Low",
    dotColor: "bg-emerald-500",
    badgeClass:
      "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800 font-medium",
  },
};

export function getPriorityBadge(priority: TaskPriority) {
  return PRIORITY_BADGES[priority] ?? PRIORITY_BADGES.low;
}

const STATUS_BADGES: Record<TaskStatus, { label: string; badgeClass: string; dotColor: string }> = {
  todo: {
    label: "To Do",
    dotColor: "bg-slate-400",
    badgeClass:
      "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700",
  },
  in_progress: {
    label: "In Progress",
    dotColor: "bg-blue-500",
    badgeClass:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-800",
  },
  in_review: {
    label: "In Review",
    dotColor: "bg-purple-500",
    badgeClass:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-800",
  },
  done: {
    label: "Done",
    dotColor: "bg-emerald-500",
    badgeClass:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800",
  },
  cancelled: {
    label: "Cancelled",
    dotColor: "bg-neutral-400",
    badgeClass:
      "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400",
  },
};

export function getStatusBadge(status: TaskStatus) {
  return STATUS_BADGES[status] ?? STATUS_BADGES.todo;
}

export function formatTimer(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function formatEstimatedMinutes(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return "No estimate";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatDurationSeconds(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  if (mins < 60) {
    const remS = s % 60;
    return remS > 0 ? `${mins}m ${remS}s` : `${mins}m`;
  }
  const hrs = Math.floor(mins / 60);
  const remM = mins % 60;
  return remM > 0 ? `${hrs}h ${remM}m` : `${hrs}h`;
}

export function createDraftTask(
  status: TaskStatus,
  teamId: string,
  creatorId: string,
  project: Project | null,
  assignee?: TaskUser | null
): TaskItem {
  return {
    id: `draft-${Date.now()}`,
    title: "",
    description: "",
    status,
    priority: "medium",
    projectId: project?.id ?? null,
    teamId,
    creatorId,
    assigneeId: assignee?.id ?? null,
    dueDate: null,
    position: 0,
    estimatedMinutes: 60,
    totalSpentSeconds: 0,
    activeSessionStartedAt: status === "in_progress" ? new Date().toISOString() : null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignee: assignee ?? null,
    creator: null,
    project,
  };
}

export function filterTasks(tasks: TaskItem[], filters: TaskFilters): TaskItem[] {
  return tasks.filter((t) => {
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q) ?? false;
      const matchAssignee = t.assignee?.name.toLowerCase().includes(q) ?? false;
      if (!matchTitle && !matchDesc && !matchAssignee) return false;
    }

    if (filters.status !== "all" && t.status !== filters.status) return false;
    if (filters.priority !== "all" && t.priority !== filters.priority) return false;

    if (filters.deadlineHorizon !== "all") {
      const d = t.dueDate ? new Date(t.dueDate) : null;
      if (!d) {
        if (filters.deadlineHorizon !== "no_date") return false;
      } else {
        if (filters.deadlineHorizon === "no_date") return false;
        if (
          filters.deadlineHorizon === "overdue" &&
          (t.status === "done" || !isPast(d) || isToday(d))
        )
          return false;
        if (filters.deadlineHorizon === "today" && !isToday(d)) return false;
        if (filters.deadlineHorizon === "upcoming" && (!isFuture(d) || isToday(d))) return false;
      }
    }
    return true;
  });
}
