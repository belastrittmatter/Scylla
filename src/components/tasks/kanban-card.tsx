"use client";

import * as React from "react";
import {
  Clock,
  AlertCircle,
  Timer,
  CheckCircle2,
  Check,
  ChevronDown,
  GitBranch,
  GitPullRequest,
  MoreHorizontal,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  TASK_FORM_STATUSES,
  type TaskItem,
  type TaskPriority,
  type TaskStatus,
} from "./task-types";
import {
  getDeadlineStatus,
  getPriorityBadge,
  getUserAvatarColor,
  formatTimer,
  formatEstimatedMinutes,
  formatDurationSeconds,
  parseTimestampMs,
} from "./task-utils";

interface KanbanCardProps {
  task: TaskItem;
  onSelectTask?: (task: TaskItem) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
}

export function KanbanCard({
  task,
  onSelectTask,
  onUpdateStatus,
}: KanbanCardProps) {
  const isDone = task.status === "done";
  const deadline = getDeadlineStatus(task.dueDate, isDone);
  const priorityInfo = getPriorityBadge(task.priority as TaskPriority);
  const avatarColor = getUserAvatarColor(task.assignee?.name || "");
  const isLinkedWithGithub = Boolean(
    task.project?.githubRepo?.trim() || task.githubIssueUrl,
  );

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (task.status !== "in_progress") return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [task.status]);

  const activeElapsed =
    task.status === "in_progress" && task.activeSessionStartedAt
      ? Math.max(
          0,
          Math.floor(
            (now - parseTimestampMs(task.activeSessionStartedAt)) / 1000,
          ),
        )
      : 0;
  const totalElapsed = (task.totalSpentSeconds || 0) + activeElapsed;
  const estMinutes = task.estimatedMinutes ?? 60;
  const estimatedSeconds = Math.max(60, estMinutes * 60);
  const progressPercent = Math.min(
    100,
    Math.round((totalElapsed / estimatedSeconds) * 100),
  );
  const isOvertime = totalElapsed > estimatedSeconds;

  const hasTags =
    !isCollapsed &&
    Boolean(
      (isLinkedWithGithub && (task.githubBranch || task.githubPrNumber)) ||
      (task.estimatedMinutes !== undefined && task.estimatedMinutes !== null),
    );

  return (
    <div
      onClick={() => onSelectTask?.(task)}
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-xl border p-3.5 select-none transition-all duration-150 cursor-pointer shadow-xs",
        "hover:border-neutral-300 hover:shadow-sm dark:hover:border-neutral-700",
        isDone
          ? "border-neutral-200/60 bg-neutral-50/60 opacity-80 dark:border-neutral-800/60 dark:bg-neutral-900/40"
          : "border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900",
      )}
    >
      {/* Card Header: Priority, Issue # (if linked with GitHub), Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "px-2 py-0.5 text-[11px] font-medium shrink-0",
              priorityInfo.badgeClass,
            )}
          >
            {priorityInfo.label}
          </Badge>

          {isLinkedWithGithub && task.githubIssueNumber && (
            <a
              href={task.githubIssueUrl || undefined}
              target="_blank"
              rel="noreferrer"
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex shrink-0 items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-[11px] text-neutral-600 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              title="View issue on GitHub"
            >
              <svg
                className="size-2.5 fill-current shrink-0"
                viewBox="0 0 24 24"
              >
                <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
              </svg>
              <span>#{task.githubIssueNumber}</span>
            </a>
          )}
        </div>

        <div
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex shrink-0 items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
        >
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="size-6 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            title={isCollapsed ? "Expand card" : "Collapse card"}
          >
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-200",
                isCollapsed && "-rotate-90",
              )}
            />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="size-6 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                  title="Move to..."
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-36 text-xs">
              {TASK_FORM_STATUSES.map((status) => (
                <DropdownMenuItem
                  key={status.value}
                  onClick={() => onUpdateStatus(task.id, status.value)}
                  className="cursor-pointer gap-1.5 text-xs"
                >
                  <span className={cn("size-2 rounded-full", status.dot)} />
                  <span>{status.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Title */}
      <div className="flex items-start gap-2">
        {isDone && (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        )}
        <h4
          className={cn(
            "text-[13px] font-medium leading-snug",
            isCollapsed ? "truncate" : "line-clamp-2",
            isDone
              ? "text-neutral-400 line-through dark:text-neutral-500"
              : "text-neutral-900 dark:text-neutral-100",
          )}
        >
          {task.title}
        </h4>
      </div>

      {/* Metadata Tags (Branch, PR, Estimate) */}
      {hasTags && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Branch (Tech view only) */}
          {isLinkedWithGithub && task.githubBranch && (
            <span
              className="inline-flex max-w-[180px] items-center gap-1.5 rounded-md border border-neutral-200/80 bg-neutral-50 px-2 py-0.5 font-mono text-[10.5px] text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
              title={`Git branch: ${task.githubBranch}`}
            >
              <GitBranch className="size-3 shrink-0 text-neutral-400" />
              <span className="truncate">{task.githubBranch}</span>
            </span>
          )}

          {/* PR badge (Tech view only) */}
          {isLinkedWithGithub && task.githubPrNumber && (
            <a
              href={task.githubPrUrl || undefined}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10.5px] transition-colors",
                task.githubPrStatus === "merged"
                  ? "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
                  : task.githubPrStatus === "open"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400",
              )}
              title={`Pull Request #${task.githubPrNumber} (${task.githubPrStatus || "open"})`}
            >
              <GitPullRequest className="size-3 shrink-0" />
              <span>PR #{task.githubPrNumber}</span>
            </a>
          )}

          {/* Estimate badge */}
          {task.estimatedMinutes !== undefined &&
            task.estimatedMinutes !== null && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200/70 bg-neutral-50/80 px-2 py-0.5 text-[10.5px] font-normal text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
                <Timer className="size-3 text-neutral-400" />
                <span>{formatEstimatedMinutes(task.estimatedMinutes)}</span>
              </span>
            )}
        </div>
      )}

      {/* Collapsed In-Progress micro badge */}
      {isCollapsed && task.status === "in_progress" && (
        <div className="flex items-center justify-between font-mono text-[10.5px] text-neutral-600 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
              {formatTimer(totalElapsed)}
            </span>
          </span>
          <span
            className={cn(
              isOvertime ? "font-semibold text-rose-500" : "text-neutral-400",
            )}
          >
            {isOvertime
              ? `+${formatDurationSeconds(totalElapsed - estimatedSeconds)}`
              : formatEstimatedMinutes(task.estimatedMinutes)}
          </span>
        </div>
      )}

      {/* Active Time Tracking Bar (expanded, comfortable padding) */}
      {!isCollapsed && task.status === "in_progress" && (
        <div className="rounded-lg border border-neutral-100 bg-neutral-50/90 p-2.5 text-xs transition-colors dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="flex items-center justify-between text-[11px] font-medium">
            <span className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="font-semibold text-[10.5px]">Tracking</span>
              <span className="font-mono font-bold tabular-nums text-neutral-900 dark:text-neutral-100 text-xs">
                {formatTimer(totalElapsed)}
              </span>
            </span>
            <span
              className={cn(
                "text-[10.5px]",
                isOvertime
                  ? "font-semibold text-rose-600 dark:text-rose-400"
                  : "text-neutral-500 dark:text-neutral-400",
              )}
            >
              {isOvertime
                ? `+${formatDurationSeconds(totalElapsed - estimatedSeconds)} over`
                : `Est: ${formatEstimatedMinutes(task.estimatedMinutes)}`}
            </span>
          </div>

          <div className="mt-1.5">
            <div
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200/80 dark:bg-neutral-800"
            >
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-300",
                  isOvertime
                    ? "bg-rose-500"
                    : progressPercent >= 80
                      ? "bg-amber-500"
                      : "bg-neutral-800 dark:bg-neutral-200",
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* For paused/completed tasks with logged time: show a compact spent summary (expanded only) */}
      {!isCollapsed &&
        task.status !== "in_progress" &&
        (task.totalSpentSeconds || 0) > 0 && (
          <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Timer className="size-3 text-neutral-400" />
              <span>
                Spent: {formatDurationSeconds(task.totalSpentSeconds!)}
              </span>
            </span>
            {task.estimatedMinutes && (
              <span>Est: {formatEstimatedMinutes(task.estimatedMinutes)}</span>
            )}
          </div>
        )}

      {/* Footer: Assignee & Deadline Status */}
      <div className="flex items-center justify-between border-t border-neutral-100/90 pt-2.5 dark:border-neutral-800/80">
        {/* Assignee Avatar */}
        <div className="flex items-center gap-2 min-w-0">
          {task.assignee ? (
            <>
              <Avatar className="size-5 border border-neutral-200 text-[10px] dark:border-neutral-700">
                <AvatarImage
                  src={task.assignee.avatarUrl}
                  alt={task.assignee.name}
                />
                <AvatarFallback className={avatarColor}>
                  {task.assignee.initials || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[120px] truncate text-xs font-medium text-neutral-700 dark:text-neutral-300">
                {task.assignee.name}
              </span>
            </>
          ) : (
            <span className="text-xs italic text-neutral-400">Unassigned</span>
          )}
        </div>

        {/* Deadline Horizon Indicator */}
        {task.dueDate && (
          <div
            className={cn(
              "flex items-center gap-1 text-[11px] font-medium shrink-0",
              deadline.isOverdue
                ? "text-rose-600 dark:text-rose-400"
                : deadline.variant === "warning"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-neutral-500 dark:text-neutral-400",
            )}
          >
            {isDone ? (
              <Check className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : deadline.isOverdue ? (
              <AlertCircle className="size-3.5 shrink-0" />
            ) : (
              <Clock className="size-3.5 shrink-0" />
            )}
            <span>{deadline.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
