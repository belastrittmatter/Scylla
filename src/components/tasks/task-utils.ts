import { format, isToday, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { getDeadlineBucket } from "./task-selectors";
import type {
  TaskItem,
  TaskFilters,
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
  for (let i = 0; i < name.length; i++)
    hash = (hash << 5) - hash + name.charCodeAt(i);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

/**
 * Safely parses any database timestamp string or Date object into a standard UTC ISO-8601 string ("...Z").
 * Prevents timezone shift bugs where database timestamps without timezone offsets (e.g. "YYYY-MM-DD HH:mm:ss.sss")
 * are inadvertently parsed using the server or browser's local timezone.
 */
export function parseDbTimestampToIso(
  val: string | Date | null | undefined,
): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  if (!String(val).trim()) return null;
  return new Date(parseTimestampMs(val)).toISOString();
}

/**
 * Safely parses a timestamp string or Date into epoch milliseconds in UTC.
 * If the input string lacks timezone info, treats it as UTC rather than local time.
 */
export function parseTimestampMs(
  val: string | number | Date | null | undefined,
): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (val instanceof Date) return val.getTime();
  const str = String(val).trim();
  if (!str) return 0;
  const hasZone = str.endsWith("Z") || /[+-]\d{2}(:\d{2})?$/.test(str);
  return new Date(hasZone ? str : `${str.replace(" ", "T")}Z`).getTime();
}

export function getDeadlineStatus(
  date: Date | string | null | undefined,
  isCompleted: boolean = false,
): {
  label: string;
  variant: "default" | "warning" | "destructive" | "muted";
  isOverdue: boolean;
} {
  const d = date ? new Date(date) : null;
  if (!d || isNaN(d.getTime())) {
    return {
      label: d ? "Invalid date" : "No deadline",
      variant: "muted",
      isOverdue: false,
    };
  }
  if (isCompleted) {
    return { label: format(d, "MMM d"), variant: "muted", isOverdue: false };
  }
  if (isPast(d) && !isToday(d)) {
    return {
      label: `Overdue (${format(d, "MMM d")})`,
      variant: "destructive",
      isOverdue: true,
    };
  }
  return isToday(d)
    ? { label: "Due today", variant: "warning", isOverdue: false }
    : { label: format(d, "MMM d"), variant: "default", isOverdue: false };
}

/** Compact elapsed time: "12m", "3h 12m", "6d 4h" (two most significant units). */
export function formatElapsedCompact(totalSeconds: number): string {
  const mins = Math.max(0, Math.floor(totalSeconds / 60));
  const days = Math.floor(mins / 1440);
  const hrs = Math.floor((mins % 1440) / 60);
  const rest = mins % 60;
  if (days > 0) return hrs ? `${days}d ${hrs}h` : `${days}d`;
  if (hrs > 0) return rest ? `${hrs}h ${rest}m` : `${hrs}h`;
  return `${rest}m`;
}

/** Quiet chip for urgent/high only; null for everything else and for closed tasks. */
export function getQuietPriority(
  priority: string,
  isClosed: boolean,
): { label: string; className: string } | null {
  if (isClosed || (priority !== "urgent" && priority !== "high")) return null;
  return {
    label: priority === "urgent" ? "Urgent" : "High",
    className: cn(
      "rounded-sm border px-1.5 py-px text-xs",
      priority === "urgent"
        ? "font-medium text-foreground"
        : "text-muted-foreground",
    ),
  };
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
  assignee?: TaskUser | null,
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
    activeSessionStartedAt:
      status === "in_progress" ? new Date().toISOString() : null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignee: assignee ?? null,
    creator: null,
    project,
  };
}

export function filterTasks(
  tasks: TaskItem[],
  filters: TaskFilters,
): TaskItem[] {
  return tasks.filter((t) => {
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q) ?? false;
      const matchAssignee = t.assignee?.name.toLowerCase().includes(q) ?? false;
      if (!matchTitle && !matchDesc && !matchAssignee) return false;
    }

    if (filters.status !== "all" && t.status !== filters.status) return false;
    if (filters.priority !== "all" && t.priority !== filters.priority)
      return false;

    if (filters.deadlineHorizon !== "all") {
      const bucket = getDeadlineBucket(t.dueDate);
      const closed = t.status === "done" || t.status === "cancelled";
      const match = {
        overdue: bucket === "overdue" && !closed,
        today: bucket === "today",
        upcoming: bucket === "upcoming7" || bucket === "later",
        no_date: bucket === "no_date",
      }[filters.deadlineHorizon];
      if (!match) return false;
    }
    return true;
  });
}

/** Picker value (`yyyy-MM-dd`) -> local 18:00, so the day survives a save/read round-trip. */
export function inputToDueDate(value: string): Date | null {
  return value ? new Date(`${value}T18:00:00`) : null;
}

export function dueDateToInput(date: Date | string | null | undefined): string {
  return date ? format(new Date(date), "yyyy-MM-dd") : "";
}

/** Undo a partial optimistic delete: bring `failedIds` back, keep everything else as it is now. */
export function restoreFailedTasks(
  current: TaskItem[],
  snapshot: TaskItem[],
  failedIds: ReadonlySet<string>,
): TaskItem[] {
  const now = new Map(current.map((t) => [t.id, t]));
  const known = new Set(snapshot.map((t) => t.id));
  return [
    ...snapshot.flatMap((t) => {
      const live = now.get(t.id);
      return failedIds.has(t.id) ? [t] : live ? [live] : [];
    }),
    ...current.filter((t) => !known.has(t.id)),
  ];
}
