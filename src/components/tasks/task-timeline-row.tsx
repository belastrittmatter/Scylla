"use client";

import * as React from "react";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getDeadlineStatus, getUserAvatarColor } from "./task-utils";
import type { TimelineSpan } from "./task-timeline";
import type { TaskItem, TaskStatus } from "./task-types";

// Same hues as TASK_FORM_STATUSES dots; Tailwind needs literal /15 and /30 classes.
const BAR_BY_STATUS: Record<TaskStatus, string> & Record<string, string> = {
  todo: "bg-muted-foreground/15 border-muted-foreground/30",
  in_progress: "bg-blue-500/15 border-blue-500/30",
  in_review: "bg-purple-500/15 border-purple-500/30",
  done: "bg-emerald-500/15 border-emerald-500/30 opacity-50",
  cancelled: "bg-muted border-border",
};

const BAR = "my-1.5 flex min-w-0 items-center rounded-md border px-1.5 text-xs";
const day = (d: TaskItem["dueDate"] | TaskItem["createdAt"]) =>
  d ? format(new Date(d), "MMM d") : "";

/** Row heights shared by the name pane and the day grid so both line up. */
const ROW_H = "h-9";

interface TaskTimelineRowProps {
  task: TaskItem;
  onSelect: (task: TaskItem) => void;
}

/** Name pane cell: title + avatar. */
export function TaskTimelineName({ task, onSelect }: TaskTimelineRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      className={cn(
        ROW_H,
        "hover:bg-accent/40 flex w-full min-w-0 items-center gap-2 px-3 text-left text-sm",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{task.title}</span>
      {task.assignee && (
        <Avatar className="size-5">
          <AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} />
          <AvatarFallback
            className={cn(
              "text-[10px]",
              getUserAvatarColor(task.assignee.name),
            )}
          >
            {task.assignee.initials || "U"}
          </AvatarFallback>
        </Avatar>
      )}
    </button>
  );
}

const col = (s: { startCol: number; span: number }) => ({
  gridColumn: `${s.startCol + 1} / span ${s.span}`,
});

/** Day grid cell row: the bar or overdue slip. */
export function TaskTimelineBars({
  task,
  span,
  slip,
  gridStyle,
  onSelect,
}: TaskTimelineRowProps & {
  /** Normal startDate (or createdAt) → dueDate bar. */
  span?: TimelineSpan;
  /** Overdue slip (task due before the window): left edge → today. */
  slip?: Omit<TimelineSpan, "clipped">;
  gridStyle: React.CSSProperties;
}) {
  const closed = task.status === "done" || task.status === "cancelled";
  const overdue = getDeadlineStatus(task.dueDate, closed).isOverdue;

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={task.title}
      onClick={() => onSelect(task)}
      className={cn(ROW_H, "hover:bg-accent/40 relative grid w-full text-left")}
      style={gridStyle}
    >
      {slip && (
        <span
          data-timeline-bar
          className={cn(
            BAR,
            "bg-destructive/15 border-destructive/40 text-destructive rounded-l-none border-l-0",
          )}
          style={col(slip)}
        >
          <span className="truncate">Due {day(task.dueDate)}</span>
        </span>
      )}
      {span && (
        <Tooltip>
          <TooltipTrigger
            render={<span />}
            data-timeline-bar
            className={cn(
              BAR,
              "text-foreground/80 gap-1",
              BAR_BY_STATUS[task.status] ?? BAR_BY_STATUS.todo,
              span.clipped && "rounded-l-none border-l-0 pl-0.5",
              overdue && "border-destructive ring-destructive/30 ring-1",
            )}
            style={col(span)}
          >
            {span.clipped && <ChevronLeft className="size-3 shrink-0" />}
            {span.span > 1 && (
              <span className="ml-auto truncate">{day(task.dueDate)}</span>
            )}
          </TooltipTrigger>
          <TooltipContent>
            {task.title}:{" "}
            {task.startDate
              ? `Start ${day(task.startDate)}`
              : `Created ${day(task.createdAt)}`}{" "}
            → Due {day(task.dueDate)}
          </TooltipContent>
        </Tooltip>
      )}
    </button>
  );
}
