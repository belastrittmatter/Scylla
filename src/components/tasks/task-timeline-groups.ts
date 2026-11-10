import type * as React from "react";
import { getOverdueSpan, getTimelineSpan } from "./task-timeline";
import type { TaskTimelineBars } from "./task-timeline-row";
import type { TaskItem } from "./task-types";

type Bars = React.ComponentProps<typeof TaskTimelineBars>;
export type RowData = Pick<Bars, "task" | "span" | "slip">;

// shortcut: fixed window (8 weeks back, 12 ahead), no endless scroll; extend if users need more.
export const DAYS = 140;
/** Group header band; identical in both panes so rows stay aligned. */
export const BAND =
  "bg-muted/60 text-muted-foreground flex h-7 items-center border-y px-3 text-xs font-medium";
const dueTime = (t: TaskItem) => new Date(t.dueDate ?? 0).getTime();

/** Group rows: "Overdue" (open, due before the window) first, then by context label. */
export function buildGroups(
  tasks: TaskItem[],
  start: Date,
  getLabel?: (task: TaskItem) => string | null,
): Map<string, RowData[]> {
  const groups = new Map<string, RowData[]>([["Overdue", []]]);
  for (const task of [...tasks].sort((a, b) => dueTime(a) - dueTime(b))) {
    const slip = getOverdueSpan(task, start, DAYS) ?? undefined;
    const span = getTimelineSpan(task, start, DAYS) ?? undefined;
    if (!slip && !span) continue;
    const label = slip ? "Overdue" : (getLabel?.(task) ?? "");
    groups.set(label, [...(groups.get(label) ?? []), { task, span, slip }]);
  }
  if (groups.get("Overdue")?.length === 0) groups.delete("Overdue");
  return groups;
}
