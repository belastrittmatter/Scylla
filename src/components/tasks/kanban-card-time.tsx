"use client";

import * as React from "react";
import { Timer } from "lucide-react";
import { formatElapsedCompact, parseTimestampMs } from "./task-utils";
import type { TaskItem } from "./task-types";

/** Compact timer + elapsed chip; renders only while a session is running. */
export function KanbanCardTime({ task }: { task: TaskItem }) {
  const running = task.status === "in_progress" && task.activeSessionStartedAt;
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [running]);

  if (!running) return null;
  const active = Math.max(
    0,
    Math.floor((now - parseTimestampMs(task.activeSessionStartedAt)) / 1000),
  );
  return (
    <span className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
      <Timer className="size-3" />
      {formatElapsedCompact((task.totalSpentSeconds || 0) + active)}
    </span>
  );
}
