"use client";

import * as React from "react";
import { Clock, AlertCircle, Timer, CheckCircle2, Check, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
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

export function KanbanCard({ task, onSelectTask, onUpdateStatus }: KanbanCardProps) {
  const isDone = task.status === "done";
  const deadline = getDeadlineStatus(task.dueDate, isDone);
  const priorityInfo = getPriorityBadge(task.priority as TaskPriority);
  const avatarColor = getUserAvatarColor(task.assignee?.name || "");

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
      ? Math.max(0, Math.floor((now - parseTimestampMs(task.activeSessionStartedAt)) / 1000))
      : 0;
  const totalElapsed = (task.totalSpentSeconds || 0) + activeElapsed;
  const estMinutes = task.estimatedMinutes ?? 60;
  const estimatedSeconds = Math.max(60, estMinutes * 60);
  const progressPercent = Math.min(100, Math.round((totalElapsed / estimatedSeconds) * 100));
  const isOvertime = totalElapsed > estimatedSeconds;

  return (
    <Card
      onClick={() => onSelectTask?.(task)}
      className={cn(
        "shadow-xs group relative select-none border p-3 transition-all hover:border-neutral-300 hover:shadow-sm dark:hover:border-neutral-700",
        isDone
          ? "border-neutral-200/50 bg-neutral-50/50 dark:border-neutral-800/60 dark:bg-neutral-900/40"
          : "border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900/90"
      )}
    >
      {/* Card Header: Priority, Est, Actions */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn("px-2 py-0.5 text-xs font-medium", priorityInfo.badgeClass)}
          >
            {priorityInfo.label}
          </Badge>

          {!isCollapsed &&
            task.estimatedMinutes !== undefined &&
            task.estimatedMinutes !== null && (
              <Badge
                variant="outline"
                className="border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[11px] font-normal text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                <Timer className="mr-1 size-3 text-neutral-400" />
                {formatEstimatedMinutes(task.estimatedMinutes)}
              </Badge>
            )}
        </div>

        <div
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center gap-1"
        >
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="size-6 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            title={isCollapsed ? "Expand card" : "Collapse card"}
          >
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-200",
                isCollapsed && "-rotate-90"
              )}
            />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="xs"
                  className="h-6 gap-1 border-neutral-200/80 bg-neutral-50/60 px-2 text-xs font-medium text-neutral-600 opacity-70 transition-all hover:bg-neutral-100 hover:text-neutral-900 group-hover:opacity-100 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white"
                >
                  <span>Move to</span>
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
      <div className="flex items-start gap-1.5">
        {isDone && (
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        )}
        <h4
          className={cn(
            "text-xs font-medium leading-snug",
            isCollapsed ? "truncate" : "line-clamp-2",
            isDone
              ? "text-neutral-500 line-through dark:text-neutral-500"
              : "text-neutral-900 dark:text-neutral-100"
          )}
        >
          {task.title}
        </h4>
      </div>

      {/* Description Snippet (hidden when collapsed) */}
      {!isCollapsed && task.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          {task.description}
        </p>
      )}

      {/* Collapsed In-Progress micro badge */}
      {isCollapsed && task.status === "in_progress" && (
        <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
              {formatTimer(totalElapsed)}
            </span>
          </span>
          <span className={cn(isOvertime ? "font-semibold text-rose-500" : "text-neutral-400")}>
            {isOvertime
              ? `+${formatDurationSeconds(totalElapsed - estimatedSeconds)}`
              : formatEstimatedMinutes(task.estimatedMinutes)}
          </span>
        </div>
      )}

      {/* Active Time Tracking Bar (expanded) */}
      {!isCollapsed && task.status === "in_progress" && (
        <div className="mt-2 rounded-md border border-neutral-100 bg-neutral-50/70 p-2 text-xs transition-colors dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="flex items-center justify-between text-[11px] font-medium">
            <span className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="font-semibold">Tracking</span>
              <span className="font-mono font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                {formatTimer(totalElapsed)}
              </span>
            </span>
            <span
              className={cn(
                "text-[11px]",
                isOvertime
                  ? "font-semibold text-rose-600 dark:text-rose-400"
                  : "text-neutral-500 dark:text-neutral-400"
              )}
            >
              {isOvertime
                ? `+${formatDurationSeconds(totalElapsed - estimatedSeconds)} over`
                : `Est: ${formatEstimatedMinutes(task.estimatedMinutes)}`}
            </span>
          </div>

          <div className="mt-1.5">
            <Progress value={progressPercent}>
              <ProgressTrack className="h-1 bg-neutral-200/80 dark:bg-neutral-800">
                <ProgressIndicator
                  className={cn(
                    "transition-all duration-300",
                    isOvertime
                      ? "bg-rose-500"
                      : progressPercent >= 80
                        ? "bg-amber-500"
                        : "bg-neutral-800 dark:bg-neutral-200"
                  )}
                />
              </ProgressTrack>
            </Progress>
          </div>
        </div>
      )}

      {/* For paused/completed tasks with logged time: show a compact spent summary (expanded only) */}
      {!isCollapsed && task.status !== "in_progress" && (task.totalSpentSeconds || 0) > 0 && (
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1">
            <Timer className="size-3 text-neutral-400" />
            <span>Spent: {formatDurationSeconds(task.totalSpentSeconds!)}</span>
          </span>
          <span>Est: {formatEstimatedMinutes(task.estimatedMinutes)}</span>
        </div>
      )}

      {/* Footer: Assignee & Deadline Status */}
      <div className="mt-2.5 flex items-center justify-between border-t border-neutral-100 pt-2 dark:border-neutral-800/80">
        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5">
          {task.assignee ? (
            <>
              <Avatar className="size-5 border border-neutral-200 text-[9px] dark:border-neutral-700">
                <AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} />
                <AvatarFallback className={avatarColor}>
                  {task.assignee.initials || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[110px] truncate text-xs font-medium text-neutral-700 dark:text-neutral-300">
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
              "flex items-center gap-1 text-[11px] font-medium",
              deadline.isOverdue
                ? "text-rose-600 dark:text-rose-400"
                : deadline.variant === "warning"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-neutral-500 dark:text-neutral-400"
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
    </Card>
  );
}
