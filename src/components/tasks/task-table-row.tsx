"use client";

import * as React from "react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getDeadlineStatus, getQuietPriority } from "./task-utils";
import { MONO_META } from "./task-layout";
import { OverdueMark } from "./task-overdue-mark";
import { StatusIcon } from "./task-status-icon";
import { TASK_FORM_STATUSES } from "./task-types";
import type { TaskItem, TaskStatus } from "./task-types";

interface TaskTableRowProps {
  task: TaskItem;
  onSelectTask: (task: TaskItem) => void;
  /** Omitted renders the status read-only. */
  onUpdateStatus?: (taskId: string, status: TaskStatus) => void;
  contextLabel?: string | null;
  showAssignee: boolean;
  /** Selection is enabled only when a toggle handler is given. */
  selected?: boolean;
  anySelected?: boolean;
  onToggleSelect?: (id: string) => void;
  /** False keeps the cell (column alignment) but hides the checkbox. */
  selectable?: boolean;
}

/** Row: status, title + context, priority, due date, assignee. Below sm, project, priority and due share one meta line under a 2-line title. */
export function TaskTableRow({
  task,
  onSelectTask,
  onUpdateStatus,
  contextLabel,
  showAssignee,
  selected = false,
  anySelected = false,
  onToggleSelect,
  selectable = true,
}: TaskTableRowProps) {
  const isClosed = task.status === "done" || task.status === "cancelled";
  const deadline = getDeadlineStatus(task.dueDate, isClosed);
  const priority = getQuietPriority(task.priority, isClosed);
  const project = contextLabel?.split(" · ").pop();
  const status =
    TASK_FORM_STATUSES.find((s) => s.value === task.status) ??
    TASK_FORM_STATUSES[0];

  return (
    <TableRow
      onClick={() => onSelectTask(task)}
      data-state={selected ? "selected" : undefined}
      className="group/row cursor-pointer"
    >
      {onToggleSelect && (
        <TableCell className="w-0 pr-0" onClick={(e) => e.stopPropagation()}>
          {selectable && (
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect(task.id)}
              aria-label={`Select ${task.title}`}
              // Hidden until hover only where hover exists; always visible on touch.
              className={cn(
                !(anySelected || selected) &&
                  "focus-visible:opacity-100 group-hover/row:opacity-100 [@media(hover:hover)]:opacity-0",
              )}
            />
          )}
        </TableCell>
      )}
      <TableCell className="w-0" onClick={(e) => e.stopPropagation()}>
        {onUpdateStatus ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Status: ${status.label}`}
                />
              }
            >
              <StatusIcon status={task.status as TaskStatus} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {TASK_FORM_STATUSES.map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  onClick={() => onUpdateStatus(task.id, s.value)}
                >
                  <StatusIcon status={s.value} />
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="flex size-6 items-center justify-center">
            <StatusIcon status={task.status as TaskStatus} />
            <span className="sr-only">Status: {status.label}</span>
          </span>
        )}
      </TableCell>

      <TableCell className="w-full max-w-0 whitespace-normal sm:whitespace-nowrap">
        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
          {/* Real button for keyboard access; its click bubbles to the row handler. */}
          <button
            type="button"
            className={cn(
              "min-w-0 text-left font-medium focus-visible:outline-2 focus-visible:outline-ring",
              isClosed && "text-muted-foreground",
            )}
          >
            <span className="block leading-snug max-sm:line-clamp-2 sm:truncate">
              {task.title}
            </span>
          </button>
          {/* Phones: priority and due date join the project here, so the title gets the row's width. */}
          {(project || priority || task.dueDate) && (
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs text-muted-foreground sm:max-w-[40%] sm:flex-nowrap">
              {project && (
                <Tooltip>
                  <TooltipTrigger
                    render={<span className="min-w-0 max-w-full truncate" />}
                  >
                    {project}
                  </TooltipTrigger>
                  <TooltipContent>{contextLabel}</TooltipContent>
                </Tooltip>
              )}
              {priority && (
                <span className={cn(priority.className, "sm:hidden")}>
                  {priority.label}
                </span>
              )}
              {task.dueDate && (
                <span
                  className={cn(
                    MONO_META,
                    "inline-flex items-baseline gap-1 whitespace-nowrap sm:hidden",
                    deadline.isOverdue && "text-destructive",
                  )}
                >
                  {format(new Date(task.dueDate), "MMM d")}
                  {deadline.isOverdue && <OverdueMark />}
                </span>
              )}
            </div>
          )}
        </div>
      </TableCell>

      <TableCell className="max-sm:hidden">
        {priority && (
          <span className={priority.className}>{priority.label}</span>
        )}
      </TableCell>

      <TableCell
        className={cn(
          MONO_META,
          "text-right max-sm:hidden",
          deadline.isOverdue ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {task.dueDate ? (
          <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
            {format(new Date(task.dueDate), "MMM d")}
            {deadline.isOverdue && <OverdueMark />}
          </span>
        ) : (
          "—"
        )}
      </TableCell>

      {showAssignee && (
        <TableCell className="w-0">
          {task.assignee && (
            <Tooltip>
              <TooltipTrigger render={<span />}>
                <Avatar className="size-6">
                  <AvatarImage
                    src={task.assignee.avatarUrl}
                    alt={task.assignee.name}
                  />
                  <AvatarFallback className="font-code text-[10px]">
                    <span aria-hidden="true">
                      {task.assignee.initials || "U"}
                    </span>
                    <span className="sr-only">
                      Assignee: {task.assignee.name}
                    </span>
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{task.assignee.name}</TooltipContent>
            </Tooltip>
          )}
        </TableCell>
      )}
    </TableRow>
  );
}
