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
import { getDeadlineStatus } from "./task-utils";
import { MONO_META, WORKSPACE_INSET } from "./task-layout";
import { OverdueMark } from "./task-overdue-mark";
import { getTaskStatusStyle } from "./task-status-icon";
import type { TimelineSpan } from "./task-timeline";
import type { TaskItem } from "./task-types";

const BAR = cn(
  MONO_META,
  "my-1.5 flex min-w-0 items-center rounded-sm border px-1.5",
);
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
        WORKSPACE_INSET,
        "hover:bg-accent/40 flex w-full min-w-0 items-center gap-2 text-left text-sm max-sm:text-xs",
      )}
    >
      {/* Phones: two short lines instead of a 4-character ellipsis; avatar hidden for room. */}
      <span className="min-w-0 flex-1 leading-tight max-sm:line-clamp-2 sm:truncate">
        {task.title}
      </span>
      {task.assignee && (
        <Avatar className="size-5 max-sm:hidden">
          <AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} />
          <AvatarFallback className="font-code text-[10px]">
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
      aria-label={overdue ? `${task.title}, overdue` : task.title}
      onClick={() => onSelect(task)}
      className={cn(ROW_H, "hover:bg-accent/40 relative grid w-full text-left")}
      style={gridStyle}
    >
      {slip && (
        <span
          data-timeline-bar
          className={cn(
            BAR,
            "bg-muted border-destructive text-destructive rounded-l-none border-l-0",
          )}
          style={col(slip)}
        >
          <span className="truncate">
            Due {day(task.dueDate)} <OverdueMark />
          </span>
        </span>
      )}
      {span && (
        <Tooltip>
          <TooltipTrigger
            render={<span />}
            data-timeline-bar
            className={cn(
              BAR,
              "gap-1",
              getTaskStatusStyle(task.status).bar,
              span.clipped && "rounded-l-none border-l-0 pl-0.5",
              // One hairline; the words below carry the meaning (WCAG 1.4.1).
              overdue && "border-destructive",
            )}
            style={col(span)}
          >
            {span.clipped && <ChevronLeft className="size-3 shrink-0" />}
            {span.span > 1 && (
              // Sticky to the scroller's right edge so a bar running past the
              // visible days still shows its due date.
              <span
                className={cn(
                  "sticky right-1.5 ml-auto min-w-0 truncate",
                  overdue && "text-destructive",
                )}
              >
                {day(task.dueDate)}
                {overdue && (
                  <>
                    {" "}
                    <OverdueMark />
                  </>
                )}
              </span>
            )}
          </TooltipTrigger>
          <TooltipContent>
            {task.title}:{" "}
            {task.startDate
              ? `Start ${day(task.startDate)}`
              : `Created ${day(task.createdAt)}`}{" "}
            → Due {day(task.dueDate)}
            {overdue && " · overdue"}
          </TooltipContent>
        </Tooltip>
      )}
    </button>
  );
}
