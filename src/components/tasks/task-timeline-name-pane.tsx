"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { EYEBROW, WORKSPACE_INSET } from "./task-layout";
import { BAND, type RowData } from "./task-timeline-groups";
import { TaskTimelineName } from "./task-timeline-row";
import type { TaskItem } from "./task-types";

/** Left pane: header, group bands, task names and the Unscheduled list. */
export function TaskTimelineNamePane({
  groups,
  unscheduled,
  onSelect,
}: {
  groups: Map<string, RowData[]>;
  unscheduled: TaskItem[];
  onSelect: (task: TaskItem) => void;
}) {
  return (
    <>
      <div className={cn(EYEBROW, WORKSPACE_INSET, "flex h-8 items-center border-b")}>
        Task
      </div>
      {[...groups].map(([name, rows]) => (
        <React.Fragment key={name}>
          {name && (
            <div className={cn(BAND, name === "Overdue" && "text-destructive")}>
              <span className="truncate">{name}</span>
            </div>
          )}
          {rows.map((r) => (
            <TaskTimelineName
              key={r.task.id}
              task={r.task}
              onSelect={onSelect}
            />
          ))}
        </React.Fragment>
      ))}
      {groups.size === 0 && (
        <p className={cn(WORKSPACE_INSET, "text-muted-foreground py-6 text-sm")}>
          Nothing scheduled in this range.
        </p>
      )}
      {unscheduled.length > 0 && (
        <details className="border-t">
          <summary className={cn(EYEBROW, WORKSPACE_INSET, "cursor-pointer py-2")}>
            Unscheduled{" "}
            <span className="tabular-nums">({unscheduled.length})</span>
          </summary>
          {unscheduled.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t)}
              className={cn(
                WORKSPACE_INSET,
                "hover:bg-accent/40 block w-full truncate py-1.5 text-left text-sm",
              )}
            >
              {t.title}
            </button>
          ))}
        </details>
      )}
    </>
  );
}
