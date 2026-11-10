"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarClock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { TaskItem, TaskStatus } from "./task-types";
import {
  getDeadlineStatus,
  getQuietPriority,
  getUserAvatarColor,
} from "./task-utils";
import { KanbanCardMenu } from "./kanban-card-menu";
import { KanbanCardTime } from "./kanban-card-time";
import { KanbanCardGithubBadges } from "./kanban-card-github-badges";
import { StatusIcon } from "./task-status-icon";

interface KanbanCardProps {
  task: TaskItem;
  onSelectTask?: (task: TaskItem) => void;
  onUpdateStatus?: (taskId: string, status: TaskStatus) => void;
  onDeleteTask?: (id: string) => Promise<boolean>;
  contextLabel?: string | null;
  showAssignee?: boolean;
  isDragging?: boolean;
}

// Keeps menu/dialog clicks (portals bubble through React) away from the card's onClick.
const stop = { onClick: (e: React.SyntheticEvent) => e.stopPropagation() };
// Nearest draggable wins: cancelling here stops a press-and-drag on ⋯ from dragging the card.
const noDrag = {
  draggable: true,
  onDragStart: (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  },
};

export function KanbanCard({
  task,
  onSelectTask,
  onUpdateStatus,
  onDeleteTask,
  contextLabel,
  showAssignee = true,
  isDragging,
}: KanbanCardProps) {
  const isClosed = task.status === "done" || task.status === "cancelled";
  const deadline = getDeadlineStatus(task.dueDate, isClosed);
  const isDueToday = deadline.variant === "warning";
  const priority = getQuietPriority(task.priority, isClosed);
  const running = task.status === "in_progress" && task.activeSessionStartedAt;
  const dateLabel =
    deadline.isOverdue && task.dueDate
      ? format(new Date(task.dueDate), "MMM d")
      : deadline.label;
  const hasMenu = Boolean(onUpdateStatus || onDeleteTask);
  const assignee = showAssignee ? task.assignee : null;

  return (
    <div
      onClick={() => onSelectTask?.(task)}
      className={cn(
        "group relative select-none rounded-lg border bg-card p-3 transition-colors hover:border-foreground/25 hover:bg-accent/30",
        isDragging && "shadow-md",
      )}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <StatusIcon status={task.status as TaskStatus} />
        <span className="min-w-0 flex-1 truncate">{contextLabel}</span>
        <div className="grid shrink-0 place-items-center" {...stop} {...noDrag}>
          {assignee && (
            <Avatar
              title={assignee.name}
              className={cn(
                "size-5 [grid-area:1/1]",
                hasMenu && "group-hover:opacity-0",
              )}
            >
              <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
              <AvatarFallback
                className={cn("text-[10px]", getUserAvatarColor(assignee.name))}
              >
                {assignee.initials || "U"}
              </AvatarFallback>
            </Avatar>
          )}
          {hasMenu && (
            <KanbanCardMenu
              task={task}
              onUpdateStatus={onUpdateStatus}
              onDeleteTask={onDeleteTask}
            />
          )}
        </div>
      </div>

      <h4 className="mt-1.5 text-sm font-medium leading-snug">
        {/* Real button for keyboard access; its click bubbles to the card handler. */}
        <button
          type="button"
          className={cn(
            "line-clamp-2 w-full text-left focus-visible:outline-2 focus-visible:outline-ring",
            isClosed ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {task.title}
        </button>
      </h4>

      {/* GitHub Linked Info (Issue, Branch, PR) */}
      <KanbanCardGithubBadges task={task} />

      {(priority || task.dueDate || running) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
          {priority && (
            <span className={priority.className}>{priority.label}</span>
          )}
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1",
                deadline.isOverdue
                  ? "text-destructive"
                  : isDueToday
                    ? "text-primary"
                    : "text-muted-foreground",
              )}
            >
              <CalendarClock className="size-3" />
              {dateLabel}
            </span>
          )}
          <KanbanCardTime task={task} />
        </div>
      )}
    </div>
  );
}
