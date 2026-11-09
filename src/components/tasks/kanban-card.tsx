"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, AlertCircle, Clock, Check } from "lucide-react";
import type { TaskItem, TaskPriority, TaskStatus } from "./task-types";
import {
  getDeadlineStatus,
  getPriorityBadge,
  getUserAvatarColor,
  parseTimestampMs,
} from "./task-utils";
import { KanbanCardHeader } from "./kanban-card-header";
import { KanbanCardTags } from "./kanban-card-tags";
import { KanbanCardTracking } from "./kanban-card-tracking";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  task: TaskItem;
  isDragging?: boolean;
  onSelectTask?: (task: TaskItem) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
}

export function KanbanCard({
  task,
  isDragging = false,
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

  // Issue #74 fix: pause 1s interval re-renders during active drag
  React.useEffect(() => {
    if (task.status !== "in_progress" || isDragging) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [task.status, isDragging]);

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
      <KanbanCardHeader
        priorityBadgeClass={priorityInfo.badgeClass}
        priorityLabel={priorityInfo.label}
        isLinkedWithGithub={isLinkedWithGithub}
        githubIssueNumber={task.githubIssueNumber}
        githubIssueUrl={task.githubIssueUrl}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        taskId={task.id}
        onUpdateStatus={onUpdateStatus}
      />

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

      {hasTags && (
        <KanbanCardTags task={task} isLinkedWithGithub={isLinkedWithGithub} />
      )}

      <KanbanCardTracking
        status={task.status as TaskStatus}
        isCollapsed={isCollapsed}
        totalElapsed={totalElapsed}
        estimatedSeconds={estimatedSeconds}
        estimatedMinutes={task.estimatedMinutes}
        totalSpentSeconds={task.totalSpentSeconds}
        progressPercent={progressPercent}
        isOvertime={isOvertime}
        isDragging={isDragging}
      />

      {/* Footer: Assignee & Deadline Status */}
      <div className="flex items-center justify-between border-t border-neutral-100/90 pt-2.5 dark:border-neutral-800/80">
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
