"use client";

import * as React from "react";
import { CheckCircle2, Check } from "lucide-react";
import {
  getDeadlineStatus,
  getPriorityBadge,
  getStatusBadge,
  getUserAvatarColor,
  formatEstimatedMinutes,
  formatDurationSeconds,
} from "./task-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { TaskItem, TaskPriority, TaskStatus } from "./task-types";
import { TASK_FORM_STATUSES } from "./task-types";

interface TaskTableRowProps {
  task: TaskItem;
  onSelectTask?: (task: TaskItem) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
}

export function TaskTableRow({ task, onSelectTask, onUpdateStatus }: TaskTableRowProps) {
  const isDone = task.status === "done";
  const deadline = getDeadlineStatus(task.dueDate, isDone);
  const priorityInfo = getPriorityBadge(task.priority as TaskPriority);
  const avatarColor = getUserAvatarColor(task.assignee?.name || "");
  const statusInfo = getStatusBadge(task.status as TaskStatus);

  return (
    <TableRow
      onClick={() => onSelectTask?.(task)}
      className={cn(
        "cursor-pointer transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50",
        isDone && "bg-neutral-50/30 opacity-80 dark:bg-neutral-900/30"
      )}
    >
      <TableCell className="max-w-[340px] py-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            {isDone && (
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            )}
            <span
              className={cn(
                "truncate text-sm font-semibold",
                isDone
                  ? "font-medium text-neutral-600 dark:text-neutral-400"
                  : "text-neutral-900 dark:text-neutral-100"
              )}
            >
              {task.title}
            </span>
          </div>
          {task.description && (
            <span className="truncate text-xs text-neutral-500">{task.description}</span>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {task.project && (
              <div className="flex items-center gap-1.5">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: task.project.color || "#6366f1" }}
                />
                <span className="truncate text-[11px] text-neutral-400">{task.project.name}</span>
              </div>
            )}
            {task.status === "in_progress" ? (
              <Badge
                variant="outline"
                className="gap-1.5 border-neutral-200/80 bg-neutral-50/70 px-2 py-0 text-[10px] font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300"
              >
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span>Tracking • Est: {formatEstimatedMinutes(task.estimatedMinutes)}</span>
              </Badge>
            ) : (
              <span className="text-muted-foreground text-[11px]">
                Est: {formatEstimatedMinutes(task.estimatedMinutes)}
                {(task.totalSpentSeconds || 0) > 0 &&
                  ` • Spent: ${formatDurationSeconds(task.totalSpentSeconds!)}`}
              </span>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="w-[150px] py-3">
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={task.status}
            onValueChange={(val) => val && onUpdateStatus(task.id, val as TaskStatus)}
          >
            <SelectTrigger className="h-8 w-full border border-neutral-200/80 bg-neutral-50/70 text-xs font-medium hover:bg-neutral-100/70 dark:border-neutral-700 dark:bg-neutral-800/80 dark:hover:bg-neutral-700/70">
              <SelectValue>
                <span className="flex items-center gap-1.5 truncate">
                  <span className={`size-2 shrink-0 rounded-full ${statusInfo.dotColor}`} />
                  <span>{statusInfo.label}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TASK_FORM_STATUSES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${opt.dot}`} />
                    <span>{opt.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TableCell>

      <TableCell className="w-[110px] py-3">
        <Badge
          variant="outline"
          className={`px-2.5 py-0.5 text-xs font-medium ${priorityInfo.badgeClass}`}
        >
          {priorityInfo.label}
        </Badge>
      </TableCell>

      <TableCell className="w-[160px] py-3">
        {task.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar className="size-6 text-[10px]">
              <AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} />
              <AvatarFallback className={avatarColor}>
                {task.assignee.initials || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[110px] truncate text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {task.assignee.name}
            </span>
          </div>
        ) : (
          <span className="text-sm italic text-neutral-400">Unassigned</span>
        )}
      </TableCell>

      <TableCell className="w-[140px] py-3 text-right">
        {task.dueDate ? (
          isDone ? (
            <span className="inline-flex items-center justify-end gap-1 text-sm text-neutral-500 dark:text-neutral-400">
              <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
              <span>{deadline.label}</span>
            </span>
          ) : (
            <span
              className={`text-sm font-medium ${
                deadline.isOverdue
                  ? "text-rose-600 dark:text-rose-400"
                  : deadline.variant === "warning"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-neutral-600 dark:text-neutral-300"
              }`}
            >
              {deadline.label}
            </span>
          )
        ) : (
          <span className="text-sm text-neutral-400">--</span>
        )}
      </TableCell>
    </TableRow>
  );
}
