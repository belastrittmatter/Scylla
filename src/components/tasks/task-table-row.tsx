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
import {
  getDeadlineStatus,
  getQuietPriority,
  getUserAvatarColor,
} from "./task-utils";
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

/** Single-line row: status, title + context, priority, due date, assignee. */
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
              className={cn(
                "opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100",
                (anySelected || selected) && "opacity-100",
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
          <span aria-label={`Status: ${status.label}`} className="flex px-1">
            <StatusIcon status={task.status as TaskStatus} />
          </span>
        )}
      </TableCell>

      <TableCell className="w-full max-w-0">
        <div className="flex min-w-0 items-baseline gap-2">
          {/* Real button for keyboard access; its click bubbles to the row handler. */}
          <button
            type="button"
            className={cn(
              "min-w-0 truncate text-left font-medium focus-visible:outline-2 focus-visible:outline-ring",
              isClosed && "text-muted-foreground",
            )}
          >
            {task.title}
          </button>
          {project && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="min-w-0 max-w-[40%] shrink truncate text-xs text-muted-foreground" />
                }
              >
                {project}
              </TooltipTrigger>
              <TooltipContent>{contextLabel}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>

      <TableCell>
        {priority && (
          <span className={priority.className}>{priority.label}</span>
        )}
      </TableCell>

      <TableCell
        className={cn(
          "text-right text-xs",
          !showAssignee && "pr-4",
          deadline.isOverdue ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {task.dueDate ? format(new Date(task.dueDate), "MMM d") : "—"}
      </TableCell>

      {showAssignee && (
        <TableCell className="w-0 pr-4">
          {task.assignee && (
            <Tooltip>
              <TooltipTrigger render={<span />}>
                <Avatar className="size-6">
                  <AvatarImage
                    src={task.assignee.avatarUrl}
                    alt={task.assignee.name}
                  />
                  <AvatarFallback
                    className={cn(
                      "text-xs",
                      getUserAvatarColor(task.assignee.name),
                    )}
                  >
                    {task.assignee.initials || "U"}
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
