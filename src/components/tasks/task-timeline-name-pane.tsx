"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
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
      <div className="text-muted-foreground flex h-8 items-center border-b px-3 text-xs">
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
        <p className="text-muted-foreground px-3 py-6 text-sm">
          Nothing scheduled in this range.
        </p>
      )}
      {unscheduled.length > 0 && (
        <details className="border-t">
          <summary className="text-muted-foreground cursor-pointer px-3 py-2 text-xs font-medium">
            Unscheduled ({unscheduled.length})
          </summary>
          {unscheduled.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t)}
              className="hover:bg-accent/40 block w-full truncate px-3 py-1.5 text-left text-sm"
            >
              {t.title}
            </button>
          ))}
        </details>
      )}
    </>
  );
}
